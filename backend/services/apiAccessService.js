const User = require('../models/User');
const { redisClient } = require('../config/database');
const crypto = require('crypto');

class ApiAccessService {
  constructor() {
    this.apiKeyPrefix = 'insightpulse_';
    this.rateLimits = {
      free: { requests: 1000, window: '1h' },
      starter: { requests: 5000, window: '1h' },
      professional: { requests: 20000, window: '1h' },
      enterprise: { requests: 100000, window: '1h' }
    };
    
    this.endpointPermissions = {
      'GET /api/feedback': ['read'],
      'POST /api/feedback': ['write'],
      'PUT /api/feedback/:id': ['write'],
      'DELETE /api/feedback/:id': ['write'],
      'GET /api/analytics': ['read'],
      'GET /api/dashboard': ['read'],
      'GET /api/alerts': ['read'],
      'POST /api/alerts': ['write'],
      'GET /api/integrations': ['read'],
      'POST /api/integrations': ['write'],
      'GET /api/feedback-gpt/query': ['ai'],
      'GET /api/segmentation': ['advanced'],
      'GET /api/churn-prediction': ['advanced'],
      'GET /api/slack-integration': ['integrations'],
      'GET /api/subscription': ['billing'],
      'GET /api/competitor-analysis': ['advanced'],
      'GET /api/reporting': ['reports'],
      'GET /api/white-label': ['enterprise']
    };
  }

  // Generate API key for user
  async generateApiKey(userId, name = 'Default API Key') {
    try {
      const apiKey = this.apiKeyPrefix + crypto.randomBytes(32).toString('hex');
      const hashedKey = crypto.createHash('sha256').hash(apiKey).digest('hex');
      
      // In a real implementation, store in database
      const apiKeyData = {
        id: crypto.randomUUID(),
        userId,
        name,
        keyHash: hashedKey,
        permissions: ['read', 'write'],
        rateLimit: 'professional',
        createdAt: new Date(),
        lastUsed: null,
        isActive: true
      };

      console.log('Generated API key for user:', userId);

      return {
        success: true,
        data: {
          apiKey,
          apiKeyData
        }
      };
    } catch (error) {
      console.error('Error generating API key:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate API key
  async validateApiKey(apiKey) {
    try {
      if (!apiKey || !apiKey.startsWith(this.apiKeyPrefix)) {
        return { valid: false, error: 'Invalid API key format' };
      }

      const hashedKey = crypto.createHash('sha256').hash(apiKey).digest('hex');
      
      // In a real implementation, query database
      // For now, return mock validation
      const apiKeyData = {
        id: 'mock-api-key-id',
        userId: 'mock-user-id',
        name: 'Default API Key',
        permissions: ['read', 'write'],
        rateLimit: 'professional',
        isActive: true
      };

      return {
        valid: true,
        data: apiKeyData
      };
    } catch (error) {
      console.error('Error validating API key:', error);
      return { valid: false, error: error.message };
    }
  }

  // Check rate limit
  async checkRateLimit(apiKey, endpoint) {
    try {
      const validation = await this.validateApiKey(apiKey);
      if (!validation.valid) {
        return { allowed: false, error: validation.error };
      }

      const apiKeyData = validation.data;
      const rateLimit = this.rateLimits[apiKeyData.rateLimit];
      
      // In a real implementation, check Redis for rate limiting
      const key = `rate_limit:${apiKeyData.id}:${endpoint}`;
      const currentCount = await redisClient.get(key) || 0;
      
      if (parseInt(currentCount) >= rateLimit.requests) {
        return {
          allowed: false,
          error: 'Rate limit exceeded',
          resetTime: this.getResetTime(rateLimit.window)
        };
      }

      // Increment counter
      await redisClient.incr(key);
      await redisClient.expire(key, this.getWindowSeconds(rateLimit.window));

      return {
        allowed: true,
        remaining: rateLimit.requests - parseInt(currentCount) - 1,
        resetTime: this.getResetTime(rateLimit.window)
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: false, error: error.message };
    }
  }

  // Check permissions
  async checkPermissions(apiKey, endpoint, method) {
    try {
      const validation = await this.validateApiKey(apiKey);
      if (!validation.valid) {
        return { allowed: false, error: validation.error };
      }

      const apiKeyData = validation.data;
      const endpointKey = `${method} ${endpoint}`;
      const requiredPermissions = this.endpointPermissions[endpointKey] || ['read'];

      const hasPermission = requiredPermissions.some(permission => 
        apiKeyData.permissions.includes(permission)
      );

      if (!hasPermission) {
        return {
          allowed: false,
          error: 'Insufficient permissions',
          required: requiredPermissions,
          current: apiKeyData.permissions
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking permissions:', error);
      return { allowed: false, error: error.message };
    }
  }

  // Get user's API keys
  async getUserApiKeys(userId) {
    try {
      // Mock API keys for demonstration
      const apiKeys = [
        {
          id: '1',
          name: 'Production API Key',
          permissions: ['read', 'write'],
          rateLimit: 'professional',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isActive: true,
          usage: {
            totalRequests: 15420,
            requestsToday: 234,
            requestsThisMonth: 5678
          }
        },
        {
          id: '2',
          name: 'Development API Key',
          permissions: ['read'],
          rateLimit: 'starter',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
          isActive: true,
          usage: {
            totalRequests: 3420,
            requestsToday: 45,
            requestsThisMonth: 1234
          }
        }
      ];

      return {
        success: true,
        data: apiKeys
      };
    } catch (error) {
      console.error('Error getting user API keys:', error);
      return { success: false, error: error.message };
    }
  }

  // Revoke API key
  async revokeApiKey(userId, apiKeyId) {
    try {
      // In a real implementation, mark as inactive in database
      console.log(`Revoking API key ${apiKeyId} for user ${userId}`);

      return {
        success: true,
        data: {
          message: 'API key revoked successfully',
          apiKeyId
        }
      };
    } catch (error) {
      console.error('Error revoking API key:', error);
      return { success: false, error: error.message };
    }
  }

  // Update API key permissions
  async updateApiKeyPermissions(userId, apiKeyId, permissions) {
    try {
      const validation = this.validatePermissions(permissions);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // In a real implementation, update database
      console.log(`Updating permissions for API key ${apiKeyId}:`, permissions);

      return {
        success: true,
        data: {
          message: 'API key permissions updated successfully',
          apiKeyId,
          permissions
        }
      };
    } catch (error) {
      console.error('Error updating API key permissions:', error);
      return { success: false, error: error.message };
    }
  }

  // Get API usage statistics
  async getApiUsageStats(userId, timeRange = '30d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      // Mock usage statistics
      const stats = {
        totalRequests: 15420,
        requestsToday: 234,
        requestsThisWeek: 1234,
        requestsThisMonth: 5678,
        averageResponseTime: 245, // ms
        errorRate: 0.5, // percentage
        topEndpoints: [
          { endpoint: '/api/feedback', requests: 5432, percentage: 35.2 },
          { endpoint: '/api/analytics', requests: 3210, percentage: 20.8 },
          { endpoint: '/api/dashboard', requests: 2345, percentage: 15.2 },
          { endpoint: '/api/alerts', requests: 1234, percentage: 8.0 },
          { endpoint: '/api/feedback-gpt/query', requests: 987, percentage: 6.4 }
        ],
        rateLimitUsage: {
          current: 234,
          limit: 20000,
          percentage: 1.17
        },
        errors: {
          rateLimitExceeded: 12,
          invalidApiKey: 3,
          insufficientPermissions: 8,
          serverErrors: 5
        }
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting API usage stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Get API documentation
  getApiDocumentation() {
    return {
      baseUrl: 'https://api.insightpulse.com/v1',
      authentication: {
        type: 'API Key',
        header: 'Authorization: Bearer YOUR_API_KEY',
        description: 'Include your API key in the Authorization header'
      },
      rateLimits: this.rateLimits,
      endpoints: [
        {
          method: 'GET',
          path: '/feedback',
          description: 'Retrieve feedback data',
          permissions: ['read'],
          parameters: {
            limit: 'number (optional)',
            offset: 'number (optional)',
            sentiment: 'string (optional)',
            source: 'string (optional)'
          },
          response: {
            success: 'boolean',
            data: 'array of feedback objects',
            total: 'number'
          }
        },
        {
          method: 'POST',
          path: '/feedback',
          description: 'Create new feedback',
          permissions: ['write'],
          body: {
            content: 'string (required)',
            customerName: 'string (optional)',
            source: 'string (optional)',
            category: 'string (optional)',
            urgency: 'string (optional)'
          },
          response: {
            success: 'boolean',
            data: 'feedback object'
          }
        },
        {
          method: 'GET',
          path: '/analytics',
          description: 'Get analytics data',
          permissions: ['read'],
          parameters: {
            timeRange: 'string (optional)',
            metrics: 'array (optional)'
          },
          response: {
            success: 'boolean',
            data: 'analytics object'
          }
        },
        {
          method: 'GET',
          path: '/feedback-gpt/query',
          description: 'Query feedback using natural language',
          permissions: ['ai'],
          parameters: {
            query: 'string (required)',
            timeRange: 'string (optional)'
          },
          response: {
            success: 'boolean',
            data: 'AI response object'
          }
        }
      ],
      errorCodes: {
        400: 'Bad Request - Invalid parameters',
        401: 'Unauthorized - Invalid API key',
        403: 'Forbidden - Insufficient permissions',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error'
      }
    };
  }

  // Validate permissions
  validatePermissions(permissions) {
    const validPermissions = ['read', 'write', 'ai', 'advanced', 'integrations', 'billing', 'reports', 'enterprise'];
    
    if (!Array.isArray(permissions)) {
      return { valid: false, error: 'Permissions must be an array' };
    }

    for (const permission of permissions) {
      if (!validPermissions.includes(permission)) {
        return { valid: false, error: `Invalid permission: ${permission}` };
      }
    }

    return { valid: true };
  }

  // Helper methods
  getWindowSeconds(window) {
    const units = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400
    };
    
    const value = parseInt(window.slice(0, -1));
    const unit = window.slice(-1);
    
    return value * (units[unit] || 3600);
  }

  getResetTime(window) {
    const now = new Date();
    const seconds = this.getWindowSeconds(window);
    return new Date(now.getTime() + seconds * 1000);
  }

  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Get available permissions
  getAvailablePermissions() {
    return [
      {
        id: 'read',
        name: 'Read Access',
        description: 'Read-only access to feedback and analytics data',
        endpoints: ['GET /api/feedback', 'GET /api/analytics', 'GET /api/dashboard']
      },
      {
        id: 'write',
        name: 'Write Access',
        description: 'Create and update feedback data',
        endpoints: ['POST /api/feedback', 'PUT /api/feedback/:id', 'DELETE /api/feedback/:id']
      },
      {
        id: 'ai',
        name: 'AI Features',
        description: 'Access to AI-powered features like Feedback GPT',
        endpoints: ['GET /api/feedback-gpt/query']
      },
      {
        id: 'advanced',
        name: 'Advanced Features',
        description: 'Access to advanced analytics and segmentation',
        endpoints: ['GET /api/segmentation', 'GET /api/churn-prediction', 'GET /api/competitor-analysis']
      },
      {
        id: 'integrations',
        name: 'Integrations',
        description: 'Access to integration management',
        endpoints: ['GET /api/integrations', 'GET /api/slack-integration']
      },
      {
        id: 'billing',
        name: 'Billing',
        description: 'Access to subscription and billing data',
        endpoints: ['GET /api/subscription']
      },
      {
        id: 'reports',
        name: 'Reports',
        description: 'Access to advanced reporting features',
        endpoints: ['GET /api/reporting']
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Full access to all features including white label',
        endpoints: ['GET /api/white-label']
      }
    ];
  }

  // Get rate limit plans
  getRateLimitPlans() {
    return Object.entries(this.rateLimits).map(([plan, limits]) => ({
      id: plan,
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      requests: limits.requests,
      window: limits.window,
      description: `${limits.requests.toLocaleString()} requests per ${limits.window}`
    }));
  }
}

module.exports = new ApiAccessService(); 