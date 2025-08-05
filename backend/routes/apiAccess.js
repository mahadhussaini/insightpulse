const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const apiAccessService = require('../services/apiAccessService');

const router = express.Router();

// Generate new API key
router.post('/keys', [
  authenticateToken,
  body('name').optional().isString().withMessage('Name must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { name = 'Default API Key' } = req.body;
  const result = await apiAccessService.generateApiKey(req.user.id, name);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Get user's API keys
router.get('/keys', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const apiKeys = await apiAccessService.getUserApiKeys(req.user.id);

  res.json({
    success: apiKeys.success,
    data: apiKeys.data
  });
}));

// Revoke API key
router.delete('/keys/:keyId', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { keyId } = req.params;
  const result = await apiAccessService.revokeApiKey(req.user.id, keyId);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Update API key permissions
router.put('/keys/:keyId/permissions', [
  authenticateToken,
  body('permissions').isArray().withMessage('Permissions must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { keyId } = req.params;
  const { permissions } = req.body;
  const result = await apiAccessService.updateApiKeyPermissions(req.user.id, keyId, permissions);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Get API usage statistics
router.get('/usage', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { timeRange = '30d' } = req.query;
  const stats = await apiAccessService.getApiUsageStats(req.user.id, timeRange);

  res.json({
    success: stats.success,
    data: stats.data
  });
}));

// Get API documentation
router.get('/documentation', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const documentation = apiAccessService.getApiDocumentation();

  res.json({
    success: true,
    data: documentation
  });
}));

// Get available permissions
router.get('/permissions', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const permissions = apiAccessService.getAvailablePermissions();

  res.json({
    success: true,
    data: permissions
  });
}));

// Get rate limit plans
router.get('/rate-limits', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const plans = apiAccessService.getRateLimitPlans();

  res.json({
    success: true,
    data: plans
  });
}));

// Validate API key
router.post('/validate', [
  authenticateToken,
  body('apiKey').isString().withMessage('API key must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { apiKey } = req.body;
  const validation = await apiAccessService.validateApiKey(apiKey);

  res.json({
    success: validation.valid,
    data: validation
  });
}));

// Check rate limit
router.post('/rate-limit', [
  authenticateToken,
  body('apiKey').isString().withMessage('API key must be a string'),
  body('endpoint').isString().withMessage('Endpoint must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { apiKey, endpoint } = req.body;
  const result = await apiAccessService.checkRateLimit(apiKey, endpoint);

  res.json({
    success: result.allowed,
    data: result
  });
}));

// Check permissions
router.post('/permissions', [
  authenticateToken,
  body('apiKey').isString().withMessage('API key must be a string'),
  body('endpoint').isString().withMessage('Endpoint must be a string'),
  body('method').isString().withMessage('Method must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { apiKey, endpoint, method } = req.body;
  const result = await apiAccessService.checkPermissions(apiKey, endpoint, method);

  res.json({
    success: result.allowed,
    data: result
  });
}));

// Get API key details
router.get('/keys/:keyId', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { keyId } = req.params;
  
  // Mock API key details
  const apiKeyDetails = {
    id: keyId,
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
    },
    endpoints: [
      { endpoint: '/api/feedback', requests: 5432, lastUsed: new Date() },
      { endpoint: '/api/analytics', requests: 3210, lastUsed: new Date() },
      { endpoint: '/api/dashboard', requests: 2345, lastUsed: new Date() }
    ]
  };

  res.json({
    success: true,
    data: apiKeyDetails
  });
}));

// Get API key usage history
router.get('/keys/:keyId/usage', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { keyId } = req.params;
  const { timeRange = '30d' } = req.query;

  // Mock usage history
  const usageHistory = [
    {
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      requests: 234,
      errors: 2,
      averageResponseTime: 245
    },
    {
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      requests: 198,
      errors: 1,
      averageResponseTime: 238
    },
    {
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      requests: 312,
      errors: 3,
      averageResponseTime: 251
    }
  ];

  res.json({
    success: true,
    data: {
      keyId,
      timeRange,
      history: usageHistory
    }
  });
}));

// Get API endpoints
router.get('/endpoints', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const documentation = apiAccessService.getApiDocumentation();
  const endpoints = documentation.endpoints.map(endpoint => ({
    ...endpoint,
    url: `${documentation.baseUrl}${endpoint.path}`,
    example: this.generateExample(endpoint)
  }));

  res.json({
    success: true,
    data: endpoints
  });
}));

// Test API endpoint
router.post('/test', [
  authenticateToken,
  body('apiKey').isString().withMessage('API key must be a string'),
  body('endpoint').isString().withMessage('Endpoint must be a string'),
  body('method').isString().withMessage('Method must be a string'),
  body('data').optional().isObject().withMessage('Data must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { apiKey, endpoint, method, data } = req.body;

  // Mock API test
  const testResult = {
    success: true,
    request: {
      method,
      endpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data
    },
    response: {
      status: 200,
      data: {
        success: true,
        message: 'Test request successful'
      }
    },
    timing: {
      total: 245,
      network: 180,
      processing: 65
    }
  };

  res.json({
    success: true,
    data: testResult
  });
}));

// Get API key analytics
router.get('/analytics', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { timeRange = '30d' } = req.query;

  // Mock analytics
  const analytics = {
    totalApiKeys: 3,
    activeApiKeys: 2,
    totalRequests: 15420,
    averageResponseTime: 245,
    errorRate: 0.5,
    topEndpoints: [
      { endpoint: '/api/feedback', requests: 5432, percentage: 35.2 },
      { endpoint: '/api/analytics', requests: 3210, percentage: 20.8 },
      { endpoint: '/api/dashboard', requests: 2345, percentage: 15.2 }
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
    },
    trends: {
      requestsPerDay: [234, 198, 312, 287, 345, 298, 267],
      errorRatePerDay: [0.4, 0.5, 0.3, 0.6, 0.4, 0.5, 0.3],
      responseTimePerDay: [245, 238, 251, 242, 248, 235, 241]
    }
  };

  res.json({
    success: true,
    data: analytics
  });
}));

// Generate example for endpoint
const generateExample = (endpoint) => {
  const baseUrl = 'https://api.insightpulse.com/v1';
  const apiKey = 'insightpulse_your_api_key_here';
  
  let example = `curl -X ${endpoint.method} \\\n`;
  example += `  "${baseUrl}${endpoint.path}" \\\n`;
  example += `  -H "Authorization: Bearer ${apiKey}" \\\n`;
  example += `  -H "Content-Type: application/json"`;
  
  if (endpoint.method === 'POST' && endpoint.body) {
    example += ` \\\n  -d '{\n`;
    Object.entries(endpoint.body).forEach(([key, type]) => {
      example += `    "${key}": "example_value",\n`;
    });
    example = example.slice(0, -2) + '\n  }';
  }
  
  return example;
};

module.exports = router; 