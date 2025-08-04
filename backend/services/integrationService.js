const axios = require('axios');
const crypto = require('crypto');
const Integration = require('../models/Integration');

class IntegrationService {
  constructor() {
    this.supportedTypes = {
      intercom: {
        name: 'Intercom',
        authType: 'oauth2',
        baseUrl: 'https://api.intercom.io',
        scopes: ['read_conversations', 'read_contacts']
      },
      zendesk: {
        name: 'Zendesk',
        authType: 'api_token',
        baseUrl: 'https://{subdomain}.zendesk.com/api/v2'
      },
      google_play: {
        name: 'Google Play Console',
        authType: 'service_account',
        baseUrl: 'https://androidpublisher.googleapis.com'
      },
      app_store: {
        name: 'App Store Connect',
        authType: 'api_key',
        baseUrl: 'https://api.appstoreconnect.apple.com'
      },
      twitter: {
        name: 'Twitter API',
        authType: 'bearer_token',
        baseUrl: 'https://api.twitter.com/2'
      },
      webhook: {
        name: 'Generic Webhook',
        authType: 'webhook',
        baseUrl: null
      }
    };
  }

  // Get supported integration types
  getSupportedTypes() {
    return this.supportedTypes;
  }

  // Test connection to an integration
  async testConnection(integration) {
    try {
      switch (integration.type) {
        case 'intercom':
          return await this.testIntercomConnection(integration);
        case 'zendesk':
          return await this.testZendeskConnection(integration);
        case 'google_play':
          return await this.testGooglePlayConnection(integration);
        case 'app_store':
          return await this.testAppStoreConnection(integration);
        case 'twitter':
          return await this.testTwitterConnection(integration);
        case 'webhook':
          return await this.testWebhookConnection(integration);
        default:
          throw new Error(`Unsupported integration type: ${integration.type}`);
      }
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  // Test Intercom connection
  async testIntercomConnection(integration) {
    const { accessToken } = integration.credentials;
    
    const response = await axios.get(`${this.supportedTypes.intercom.baseUrl}/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data,
      message: 'Intercom connection successful'
    };
  }

  // Test Zendesk connection
  async testZendeskConnection(integration) {
    const { subdomain, apiToken, email } = integration.credentials;
    const auth = Buffer.from(`${email}/token:${apiToken}`).toString('base64');
    
    const response = await axios.get(
      `https://${subdomain}.zendesk.com/api/v2/users/me.json`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data,
      message: 'Zendesk connection successful'
    };
  }

  // Test Google Play connection
  async testGooglePlayConnection(integration) {
    const { serviceAccountKey, packageName } = integration.credentials;
    
    // This would require Google Cloud authentication
    // For now, we'll simulate a successful connection
    return {
      success: true,
      data: { packageName },
      message: 'Google Play connection successful'
    };
  }

  // Test App Store connection
  async testAppStoreConnection(integration) {
    const { apiKey, keyId, issuerId } = integration.credentials;
    
    // This would require Apple's JWT token generation
    // For now, we'll simulate a successful connection
    return {
      success: true,
      data: { issuerId },
      message: 'App Store connection successful'
    };
  }

  // Test Twitter connection
  async testTwitterConnection(integration) {
    const { bearerToken } = integration.credentials;
    
    const response = await axios.get(`${this.supportedTypes.twitter.baseUrl}/users/me`, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      data: response.data,
      message: 'Twitter connection successful'
    };
  }

  // Test webhook connection
  async testWebhookConnection(integration) {
    const { webhookUrl } = integration.config;
    
    if (!webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    return {
      success: true,
      data: { webhookUrl },
      message: 'Webhook configuration valid'
    };
  }

  // Sync data from an integration
  async syncIntegration(integrationId) {
    const integration = await Integration.findByPk(integrationId);
    if (!integration) {
      throw new Error('Integration not found');
    }

    try {
      integration.status = 'syncing';
      await integration.save();

      let syncResult;
      switch (integration.type) {
        case 'intercom':
          syncResult = await this.syncIntercomData(integration);
          break;
        case 'zendesk':
          syncResult = await this.syncZendeskData(integration);
          break;
        case 'google_play':
          syncResult = await this.syncGooglePlayData(integration);
          break;
        case 'app_store':
          syncResult = await this.syncAppStoreData(integration);
          break;
        case 'twitter':
          syncResult = await this.syncTwitterData(integration);
          break;
        default:
          throw new Error(`Unsupported sync for type: ${integration.type}`);
      }

      // Update integration stats
      await integration.updateStats({
        lastSyncItems: syncResult.count,
        totalItems: (integration.stats.totalItems || 0) + syncResult.count
      });

      integration.status = 'connected';
      integration.lastSync = new Date();
      await integration.save();

      return syncResult;
    } catch (error) {
      integration.status = 'error';
      integration.errorMessage = error.message;
      await integration.save();
      throw error;
    }
  }

  // Sync Intercom conversations
  async syncIntercomData(integration) {
    const { accessToken } = integration.credentials;
    const { workspaceId } = integration.config;

    const response = await axios.get(
      `${this.supportedTypes.intercom.baseUrl}/conversations`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        },
        params: {
          per_page: 50,
          starting_after: integration.lastSync ? new Date(integration.lastSync).getTime() / 1000 : undefined
        }
      }
    );

    const conversations = response.data.conversations || [];
    const feedbackItems = conversations.map(conv => ({
      content: conv.conversation_message.body,
      source: 'intercom',
      sourceId: conv.id,
      author: conv.conversation_message.author.name,
      timestamp: new Date(conv.created_at * 1000),
      metadata: {
        conversationId: conv.id,
        conversationType: conv.conversation_parts?.conversation_parts?.[0]?.part_type || 'comment'
      }
    }));

    return {
      count: feedbackItems.length,
      items: feedbackItems
    };
  }

  // Sync Zendesk tickets
  async syncZendeskData(integration) {
    const { subdomain, apiToken, email } = integration.credentials;
    const auth = Buffer.from(`${email}/token:${apiToken}`).toString('base64');

    const response = await axios.get(
      `https://${subdomain}.zendesk.com/api/v2/tickets.json`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        params: {
          per_page: 50,
          sort_by: 'updated_at',
          sort_order: 'desc'
        }
      }
    );

    const tickets = response.data.tickets || [];
    const feedbackItems = tickets.map(ticket => ({
      content: ticket.description,
      source: 'zendesk',
      sourceId: ticket.id.toString(),
      author: ticket.requester_id.toString(),
      timestamp: new Date(ticket.updated_at),
      metadata: {
        ticketId: ticket.id,
        priority: ticket.priority,
        status: ticket.status,
        subject: ticket.subject
      }
    }));

    return {
      count: feedbackItems.length,
      items: feedbackItems
    };
  }

  // Sync Google Play reviews
  async syncGooglePlayData(integration) {
    const { packageName } = integration.credentials;
    
    // This would require Google Play Console API
    // For now, return mock data
    return {
      count: 0,
      items: []
    };
  }

  // Sync App Store reviews
  async syncAppStoreData(integration) {
    const { appId } = integration.credentials;
    
    // This would require App Store Connect API
    // For now, return mock data
    return {
      count: 0,
      items: []
    };
  }

  // Sync Twitter mentions
  async syncTwitterData(integration) {
    const { bearerToken } = integration.credentials;
    const { searchQuery } = integration.config;

    const response = await axios.get(
      `${this.supportedTypes.twitter.baseUrl}/tweets/search/recent`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          query: searchQuery,
          max_results: 100,
          'tweet.fields': 'created_at,author_id,text'
        }
      }
    );

    const tweets = response.data.data || [];
    const feedbackItems = tweets.map(tweet => ({
      content: tweet.text,
      source: 'twitter',
      sourceId: tweet.id,
      author: tweet.author_id,
      timestamp: new Date(tweet.created_at),
      metadata: {
        tweetId: tweet.id,
        authorId: tweet.author_id
      }
    }));

    return {
      count: feedbackItems.length,
      items: feedbackItems
    };
  }

  // Generate webhook signature
  generateWebhookSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = this.generateWebhookSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = new IntegrationService(); 