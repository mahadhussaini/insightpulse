const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const slackIntegrationService = require('../services/slackIntegrationService');

const router = express.Router();

// Test Slack connection
router.post('/test', [
  authenticateToken,
  body('webhookUrl').optional().isURL().withMessage('Invalid webhook URL'),
  body('channelId').optional().isString().withMessage('Channel ID must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { webhookUrl, channelId } = req.body;

  // Temporarily set webhook URL for testing
  if (webhookUrl) {
    slackIntegrationService.webhookUrl = webhookUrl;
  }
  if (channelId) {
    slackIntegrationService.channelId = channelId;
  }

  const result = await slackIntegrationService.testConnection();

  res.json({
    success: result.success,
    data: {
      connected: result.success,
      messageId: result.messageId,
      error: result.error
    }
  });
}));

// Configure Slack settings
router.post('/configure', [
  authenticateToken,
  body('webhookUrl').isURL().withMessage('Invalid webhook URL'),
  body('channelId').isString().withMessage('Channel ID must be a string'),
  body('botToken').optional().isString().withMessage('Bot token must be a string'),
  body('enabled').isBoolean().withMessage('Enabled must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { webhookUrl, channelId, botToken, enabled } = req.body;

  const result = await slackIntegrationService.configureSettings({
    webhookUrl,
    channelId,
    botToken,
    enabled
  });

  res.json({
    success: result.success,
    data: {
      configured: result.success,
      settings: result.settings,
      error: result.error
    }
  });
}));

// Get current configuration
router.get('/configuration', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const config = slackIntegrationService.getConfiguration();

  res.json({
    success: true,
    data: config
  });
}));

// Send test notification
router.post('/send-test', [
  authenticateToken,
  body('type').isIn(['new_feedback', 'high_priority', 'churn_risk', 'sentiment_alert', 'weekly_summary', 'daily_digest']).withMessage('Invalid notification type'),
  body('data').isObject().withMessage('Data must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { type, data, options } = req.body;

  const result = await slackIntegrationService.sendImmediateNotification(type, data, options);

  res.json({
    success: result.success,
    data: {
      sent: result.success,
      messageId: result.messageId,
      error: result.error
    }
  });
}));

// Get notification history
router.get('/history', [
  authenticateToken,
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { limit = 50 } = req.query;

  const result = await slackIntegrationService.getNotificationHistory(parseInt(limit));

  res.json({
    success: result.success,
    data: {
      notifications: result.notifications,
      total: result.notifications.length
    }
  });
}));

// Send scheduled notification
router.post('/scheduled', [
  authenticateToken,
  body('scheduleType').isIn(['daily_digest', 'weekly_summary']).withMessage('Invalid schedule type'),
  body('data').isObject().withMessage('Data must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { scheduleType, data } = req.body;

  const result = await slackIntegrationService.sendScheduledNotification(scheduleType, data);

  res.json({
    success: result.success,
    data: {
      sent: result.success,
      messageId: result.messageId,
      reason: result.reason,
      error: result.error
    }
  });
}));

// Get notification types
router.get('/types', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const notificationTypes = Object.values(slackIntegrationService.notificationTypes);
  const typeMetadata = {
    [slackIntegrationService.notificationTypes.NEW_FEEDBACK]: {
      name: 'New Feedback',
      description: 'Notify when new feedback is received',
      icon: 'message-square',
      color: 'blue'
    },
    [slackIntegrationService.notificationTypes.HIGH_PRIORITY]: {
      name: 'High Priority Alert',
      description: 'Notify for high-priority feedback',
      icon: 'alert-triangle',
      color: 'red'
    },
    [slackIntegrationService.notificationTypes.CHURN_RISK]: {
      name: 'Churn Risk Alert',
      description: 'Notify when churn risk is detected',
      icon: 'trending-down',
      color: 'orange'
    },
    [slackIntegrationService.notificationTypes.SENTIMENT_ALERT]: {
      name: 'Sentiment Alert',
      description: 'Notify for significant sentiment changes',
      icon: 'bar-chart-3',
      color: 'yellow'
    },
    [slackIntegrationService.notificationTypes.WEEKLY_SUMMARY]: {
      name: 'Weekly Summary',
      description: 'Send weekly feedback summary',
      icon: 'calendar',
      color: 'green'
    },
    [slackIntegrationService.notificationTypes.DAILY_DIGEST]: {
      name: 'Daily Digest',
      description: 'Send daily feedback digest',
      icon: 'clock',
      color: 'purple'
    }
  };

  const typesWithMetadata = notificationTypes.map(type => ({
    id: type,
    ...typeMetadata[type]
  }));

  res.json({
    success: true,
    data: typesWithMetadata
  });
}));

// Get notification settings
router.get('/settings', [
  authenticateToken
], asyncHandler(async (req, res) => {
  // Mock settings (in a real implementation, these would be stored in database)
  const settings = {
    notifications: {
      newFeedback: {
        enabled: true,
        channel: '#feedback',
        frequency: 'immediate'
      },
      highPriority: {
        enabled: true,
        channel: '#alerts',
        frequency: 'immediate'
      },
      churnRisk: {
        enabled: true,
        channel: '#customer-success',
        frequency: 'immediate'
      },
      sentimentAlert: {
        enabled: true,
        channel: '#analytics',
        frequency: 'daily'
      },
      weeklySummary: {
        enabled: true,
        channel: '#reports',
        frequency: 'weekly',
        day: 'friday',
        time: '09:00'
      },
      dailyDigest: {
        enabled: true,
        channel: '#daily',
        frequency: 'daily',
        time: '08:00'
      }
    },
    general: {
      enabled: true,
      defaultChannel: '#insightpulse',
      timezone: 'UTC',
      language: 'en'
    }
  };

  res.json({
    success: true,
    data: settings
  });
}));

// Update notification settings
router.put('/settings', [
  authenticateToken,
  body('notifications').optional().isObject().withMessage('Notifications must be an object'),
  body('general').optional().isObject().withMessage('General settings must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { notifications, general } = req.body;

  // In a real implementation, you'd save these settings to database
  console.log('Updating Slack notification settings:', { notifications, general });

  res.json({
    success: true,
    data: {
      message: 'Settings updated successfully',
      settings: { notifications, general }
    }
  });
}));

// Get notification statistics
router.get('/stats', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid time range')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange = '30d' } = req.query;

  // Mock statistics (in a real implementation, these would be calculated from database)
  const stats = {
    totalSent: 156,
    successRate: 98.7,
    byType: {
      new_feedback: 89,
      high_priority: 23,
      churn_risk: 12,
      sentiment_alert: 8,
      weekly_summary: 12,
      daily_digest: 12
    },
    byTimeRange: {
      last7Days: 23,
      last30Days: 156,
      last90Days: 423
    },
    errors: {
      total: 2,
      rate: 1.3,
      types: {
        'webhook_timeout': 1,
        'invalid_channel': 1
      }
    }
  };

  res.json({
    success: true,
    data: {
      stats,
      timeRange
    }
  });
}));

// Enable/disable notifications
router.post('/toggle', [
  authenticateToken,
  body('type').isIn(['new_feedback', 'high_priority', 'churn_risk', 'sentiment_alert', 'weekly_summary', 'daily_digest', 'all']).withMessage('Invalid notification type'),
  body('enabled').isBoolean().withMessage('Enabled must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { type, enabled } = req.body;

  // In a real implementation, you'd update the database
  console.log(`Toggling ${type} notifications to ${enabled}`);

  res.json({
    success: true,
    data: {
      message: `${type} notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
      type,
      enabled
    }
  });
}));

module.exports = router; 