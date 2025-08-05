const axios = require('axios');
const { redisClient } = require('../config/database');

class SlackIntegrationService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.botToken = process.env.SLACK_BOT_TOKEN;
    this.channelId = process.env.SLACK_CHANNEL_ID;
    
    this.notificationTypes = {
      NEW_FEEDBACK: 'new_feedback',
      HIGH_PRIORITY: 'high_priority',
      CHURN_RISK: 'churn_risk',
      SENTIMENT_ALERT: 'sentiment_alert',
      WEEKLY_SUMMARY: 'weekly_summary',
      DAILY_DIGEST: 'daily_digest'
    };
  }

  // Send notification to Slack
  async sendNotification(type, data, options = {}) {
    try {
      if (!this.webhookUrl) {
        console.warn('⚠️ Slack webhook URL not configured');
        return { success: false, error: 'Slack not configured' };
      }

      const message = this.buildMessage(type, data, options);
      const response = await axios.post(this.webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        console.log(`✅ Slack notification sent: ${type}`);
        return { success: true, messageId: response.data.ts };
      } else {
        throw new Error(`Slack API returned status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Slack notification failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Build Slack message based on notification type
  buildMessage(type, data, options) {
    const baseMessage = {
      channel: options.channel || this.channelId,
      username: 'InsightPulse Bot',
      icon_emoji: ':chart_with_upwards_trend:'
    };

    switch (type) {
      case this.notificationTypes.NEW_FEEDBACK:
        return this.buildNewFeedbackMessage(data, baseMessage);
      
      case this.notificationTypes.HIGH_PRIORITY:
        return this.buildHighPriorityMessage(data, baseMessage);
      
      case this.notificationTypes.CHURN_RISK:
        return this.buildChurnRiskMessage(data, baseMessage);
      
      case this.notificationTypes.SENTIMENT_ALERT:
        return this.buildSentimentAlertMessage(data, baseMessage);
      
      case this.notificationTypes.WEEKLY_SUMMARY:
        return this.buildWeeklySummaryMessage(data, baseMessage);
      
      case this.notificationTypes.DAILY_DIGEST:
        return this.buildDailyDigestMessage(data, baseMessage);
      
      default:
        return this.buildGenericMessage(data, baseMessage);
    }
  }

  // Build new feedback notification
  buildNewFeedbackMessage(data, baseMessage) {
    const { feedback, user } = data;
    const sentimentColor = this.getSentimentColor(feedback.sentiment);
    const urgencyColor = this.getUrgencyColor(feedback.urgency);

    return {
      ...baseMessage,
      attachments: [{
        color: sentimentColor,
        title: `New Feedback from ${feedback.source}`,
        title_link: options?.feedbackUrl || '#',
        fields: [
          {
            title: 'Customer',
            value: feedback.customerName || 'Anonymous',
            short: true
          },
          {
            title: 'Sentiment',
            value: feedback.sentiment,
            short: true
          },
          {
            title: 'Urgency',
            value: feedback.urgency,
            short: true
          },
          {
            title: 'Source',
            value: feedback.source,
            short: true
          },
          {
            title: 'Content',
            value: feedback.content.length > 200 
              ? feedback.content.substring(0, 200) + '...' 
              : feedback.content
          }
        ],
        footer: `InsightPulse • ${new Date(feedback.createdAt).toLocaleString()}`,
        footer_icon: ':chart_with_upwards_trend:'
      }]
    };
  }

  // Build high priority notification
  buildHighPriorityMessage(data, baseMessage) {
    const { feedback, user } = data;

    return {
      ...baseMessage,
      attachments: [{
        color: '#ff0000',
        title: '🚨 High Priority Alert',
        title_link: options?.feedbackUrl || '#',
        text: `*${feedback.customerName || 'Anonymous'}* reported a high-priority issue`,
        fields: [
          {
            title: 'Issue',
            value: feedback.content.length > 100 
              ? feedback.content.substring(0, 100) + '...' 
              : feedback.content
          },
          {
            title: 'Source',
            value: feedback.source,
            short: true
          },
          {
            title: 'Urgency',
            value: feedback.urgency,
            short: true
          }
        ],
        actions: [
          {
            type: 'button',
            text: 'View Details',
            url: options?.feedbackUrl || '#',
            style: 'primary'
          },
          {
            type: 'button',
            text: 'Mark Resolved',
            url: options?.resolveUrl || '#',
            style: 'danger'
          }
        ],
        footer: `InsightPulse • ${new Date(feedback.createdAt).toLocaleString()}`,
        footer_icon: ':warning:'
      }]
    };
  }

  // Build churn risk notification
  buildChurnRiskMessage(data, baseMessage) {
    const { customer, riskScore, riskLevel, factors } = data;

    return {
      ...baseMessage,
      attachments: [{
        color: this.getRiskColor(riskLevel),
        title: `⚠️ Churn Risk Alert: ${customer.name || customer.email}`,
        text: `Risk score: *${riskScore}* (${riskLevel} risk)`,
        fields: [
          {
            title: 'Retention Probability',
            value: `${data.retentionProbability?.toFixed(1)}%`,
            short: true
          },
          {
            title: 'Risk Level',
            value: riskLevel,
            short: true
          },
          {
            title: 'Key Factors',
            value: factors.map(f => `• ${f.description}`).join('\n'),
            short: false
          }
        ],
        actions: [
          {
            type: 'button',
            text: 'View Analysis',
            url: options?.analysisUrl || '#',
            style: 'primary'
          },
          {
            type: 'button',
            text: 'Take Action',
            url: options?.actionUrl || '#',
            style: 'danger'
          }
        ],
        footer: `InsightPulse • ${new Date().toLocaleString()}`,
        footer_icon: ':chart_with_downwards_trend:'
      }]
    };
  }

  // Build sentiment alert notification
  buildSentimentAlertMessage(data, baseMessage) {
    const { feedback, trend, threshold } = data;

    return {
      ...baseMessage,
      attachments: [{
        color: '#ff6b35',
        title: '📊 Sentiment Alert',
        text: `Sentiment trend has ${trend > 0 ? 'improved' : 'declined'} by ${Math.abs(trend)}%`,
        fields: [
          {
            title: 'Current Sentiment',
            value: `${data.currentSentiment}%`,
            short: true
          },
          {
            title: 'Threshold',
            value: `${threshold}%`,
            short: true
          },
          {
            title: 'Recent Feedback',
            value: feedback.map(f => `• ${f.sentiment}: ${f.content.substring(0, 50)}...`).join('\n'),
            short: false
          }
        ],
        footer: `InsightPulse • ${new Date().toLocaleString()}`,
        footer_icon: ':chart_with_upwards_trend:'
      }]
    };
  }

  // Build weekly summary notification
  buildWeeklySummaryMessage(data, baseMessage) {
    const { summary, metrics, trends } = data;

    return {
      ...baseMessage,
      attachments: [{
        color: '#36a64f',
        title: '📈 Weekly Summary',
        text: summary,
        fields: [
          {
            title: 'Total Feedback',
            value: metrics.totalFeedback.toString(),
            short: true
          },
          {
            title: 'Avg Sentiment',
            value: `${metrics.avgSentiment}%`,
            short: true
          },
          {
            title: 'Response Rate',
            value: `${metrics.responseRate}%`,
            short: true
          },
          {
            title: 'Top Issues',
            value: trends.topIssues.join(', '),
            short: true
          },
          {
            title: 'Key Insights',
            value: trends.insights.join('\n'),
            short: false
          }
        ],
        footer: `InsightPulse • Week ending ${new Date().toLocaleDateString()}`,
        footer_icon: ':chart_with_upwards_trend:'
      }]
    };
  }

  // Build daily digest notification
  buildDailyDigestMessage(data, baseMessage) {
    const { digest, metrics } = data;

    return {
      ...baseMessage,
      attachments: [{
        color: '#4a90e2',
        title: '📋 Daily Digest',
        text: digest,
        fields: [
          {
            title: 'New Feedback',
            value: metrics.newFeedback.toString(),
            short: true
          },
          {
            title: 'High Priority',
            value: metrics.highPriority.toString(),
            short: true
          },
          {
            title: 'Avg Sentiment',
            value: `${metrics.avgSentiment}%`,
            short: true
          },
          {
            title: 'Resolved Issues',
            value: metrics.resolvedIssues.toString(),
            short: true
          }
        ],
        footer: `InsightPulse • ${new Date().toLocaleDateString()}`,
        footer_icon: ':chart_with_upwards_trend:'
      }]
    };
  }

  // Build generic message
  buildGenericMessage(data, baseMessage) {
    return {
      ...baseMessage,
      text: data.message || 'InsightPulse notification',
      attachments: data.attachments || []
    };
  }

  // Helper methods for colors
  getSentimentColor(sentiment) {
    switch (sentiment) {
      case 'positive': return '#36a64f';
      case 'negative': return '#ff0000';
      case 'neutral': return '#4a90e2';
      case 'mixed': return '#ff6b35';
      default: return '#4a90e2';
    }
  }

  getUrgencyColor(urgency) {
    switch (urgency) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6b35';
      case 'medium': return '#ffa500';
      case 'low': return '#36a64f';
      default: return '#4a90e2';
    }
  }

  getRiskColor(riskLevel) {
    switch (riskLevel) {
      case 'critical': return '#ff0000';
      case 'high': return '#ff6b35';
      case 'medium': return '#ffa500';
      case 'low': return '#36a64f';
      default: return '#4a90e2';
    }
  }

  // Send scheduled notifications
  async sendScheduledNotification(scheduleType, data) {
    try {
      const cacheKey = `slack_schedule_${scheduleType}_${new Date().toDateString()}`;
      const alreadySent = await redisClient.get(cacheKey);
      
      if (alreadySent) {
        console.log(`Scheduled notification ${scheduleType} already sent today`);
        return { success: false, reason: 'already_sent' };
      }

      const result = await this.sendNotification(scheduleType, data);
      
      if (result.success) {
        // Cache for 24 hours to prevent duplicate sends
        await redisClient.setex(cacheKey, 86400, 'sent');
      }
      
      return result;
    } catch (error) {
      console.error('Scheduled notification failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send immediate notification
  async sendImmediateNotification(type, data, options = {}) {
    return await this.sendNotification(type, data, options);
  }

  // Test Slack connection
  async testConnection() {
    try {
      if (!this.webhookUrl) {
        return { success: false, error: 'Webhook URL not configured' };
      }

      const testMessage = {
        text: '🧪 InsightPulse Slack integration test successful!',
        channel: this.channelId,
        username: 'InsightPulse Bot',
        icon_emoji: ':white_check_mark:'
      };

      const response = await axios.post(this.webhookUrl, testMessage, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return { 
        success: response.status === 200, 
        messageId: response.data?.ts 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get notification history
  async getNotificationHistory(limit = 50) {
    try {
      // In a real implementation, you'd store notification history in database
      // For now, return mock data
      return {
        success: true,
        notifications: [
          {
            id: '1',
            type: 'new_feedback',
            sentAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
            status: 'delivered',
            messageId: '1234567890.123456'
          },
          {
            id: '2',
            type: 'high_priority',
            sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            status: 'delivered',
            messageId: '1234567890.123457'
          }
        ]
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Configure Slack settings
  async configureSettings(settings) {
    try {
      const { webhookUrl, channelId, botToken, enabled } = settings;
      
      // In a real implementation, you'd save these to database
      this.webhookUrl = webhookUrl;
      this.channelId = channelId;
      this.botToken = botToken;
      
      // Test the configuration
      if (enabled) {
        const testResult = await this.testConnection();
        return {
          success: testResult.success,
          error: testResult.error,
          settings: { webhookUrl, channelId, enabled }
        };
      }
      
      return { success: true, settings: { webhookUrl, channelId, enabled } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get current configuration
  getConfiguration() {
    return {
      webhookUrl: this.webhookUrl,
      channelId: this.channelId,
      botToken: this.botToken ? '***configured***' : null,
      enabled: !!this.webhookUrl
    };
  }
}

module.exports = new SlackIntegrationService(); 