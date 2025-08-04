const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const Feedback = require('../models/Feedback');
const aiService = require('../services/aiService');
const { redisClient } = require('../config/database');
const { Op } = require('sequelize');

const router = express.Router();

// Get dashboard overview data
router.get('/overview', [
  query('timeRange').optional().isIn(['7d', '30d', '90d']),
  query('source').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange = '7d', source, dateFrom, dateTo } = req.query;
  const whereClause = { userId: req.user.id };

  // Source filter
  if (source && source !== 'all') {
    whereClause.source = source;
  }

  // Date range filter based on timeRange
  if (timeRange) {
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    whereClause.createdAt = { [Op.gte]: startDate };
  }

  // Custom date range filter
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
  }

  // Get overview metrics
  const totalFeedback = await Feedback.count({ where: whereClause });
  const positiveFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'positive' } });
  const negativeFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'negative' } });
  const neutralFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'neutral' } });
  const resolvedFeedback = await Feedback.count({ where: { ...whereClause, isResolved: true } });

  // Get average sentiment score (using sentiment instead of sentimentScore)
  const avgSentimentResult = await Feedback.findOne({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ]
  });

  // Get recent feedback (last 7 days)
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const recentFeedback = await Feedback.count({
    where: {
      ...whereClause,
      createdAt: { [Op.gte]: lastWeekDate }
    }
  });

  // Get urgent feedback
  const urgentFeedback = await Feedback.count({
    where: {
      ...whereClause,
      urgency: { [Op.in]: ['high', 'critical'] }
    }
  });

  // Get top sources
  const topSources = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'source',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['source'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
    limit: 5
  });

  // Get sentiment trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sentimentTrend = await Feedback.findAll({
    where: {
      ...whereClause,
      createdAt: { [Op.gte]: thirtyDaysAgo }
    },
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']]
  });

  res.json({
    overview: {
      totalFeedback,
      positiveFeedback,
      negativeFeedback,
      neutralFeedback,
      resolvedFeedback,
      avgSentimentScore: parseFloat(avgSentimentResult?.dataValues.avgSentiment || 0),
      recentFeedback,
      urgentFeedback,
      resolutionRate: totalFeedback > 0 ? (resolvedFeedback / totalFeedback) * 100 : 0,
      topSources: topSources.map(source => ({
        source: source.dataValues.source,
        count: parseInt(source.dataValues.count)
      })),
      sentimentTrend: sentimentTrend.map(trend => ({
        date: trend.dataValues.date,
        count: parseInt(trend.dataValues.count),
        avgSentiment: parseFloat(trend.dataValues.avgSentiment || 0)
      }))
    }
  });
}));

// Get main dashboard data
router.get('/', [
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { dateFrom, dateTo } = req.query;
  const whereClause = { userId: req.user.id };

  // Date range filter
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
  }

  // Get overview metrics
  const totalFeedback = await Feedback.count({ where: whereClause });
  const positiveFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'positive' } });
  const negativeFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'negative' } });
  const neutralFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'neutral' } });
  const resolvedFeedback = await Feedback.count({ where: { ...whereClause, isResolved: true } });

  // Get average sentiment score (using sentiment instead of sentimentScore)
  const avgSentimentResult = await Feedback.findOne({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ]
  });

  // Get recent feedback (last 7 days)
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const recentFeedback = await Feedback.count({
    where: {
      ...whereClause,
      createdAt: { [Op.gte]: lastWeekDate }
    }
  });

  // Get urgent feedback
  const urgentFeedback = await Feedback.count({
    where: {
      ...whereClause,
      urgency: { [Op.in]: ['high', 'critical'] }
    }
  });

  // Get top sources
  const topSources = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'source',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['source'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
    limit: 5
  });

  // Get sentiment trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sentimentTrend = await Feedback.findAll({
    where: {
      ...whereClause,
      createdAt: { [Op.gte]: thirtyDaysAgo }
    },
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('createdAt'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('createdAt')), 'ASC']]
  });

  // Get recent feedback items
  const recentItems = await Feedback.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: 10,
    attributes: [
      'id',
      'content',
      'sentiment',
      'sentimentScore',
      'urgency',
      'source',
      'createdAt',
      'isResolved',
      'customerName'
    ]
  });

  res.json({
    dashboard: {
      overview: {
        totalFeedback,
        positiveFeedback,
        negativeFeedback,
        neutralFeedback,
        resolvedFeedback,
        avgSentimentScore: parseFloat(avgSentimentResult?.dataValues.avgSentiment || 0),
        recentFeedback,
        urgentFeedback,
        resolutionRate: totalFeedback > 0 ? (resolvedFeedback / totalFeedback) * 100 : 0
      },
      topSources: topSources.map(source => ({
        source: source.dataValues.source,
        count: parseInt(source.dataValues.count)
      })),
      sentimentTrend: sentimentTrend.map(trend => ({
        date: trend.dataValues.date,
        count: parseInt(trend.dataValues.count),
        avgSentiment: parseFloat(trend.dataValues.avgSentiment || 0)
      })),
      recentItems: recentItems.map(item => ({
        id: item.id,
        content: item.content.substring(0, 100) + (item.content.length > 100 ? '...' : ''),
        sentiment: item.sentiment,
        sentimentScore: item.sentiment === 'positive' ? 1 : item.sentiment === 'negative' ? -1 : 0,
        urgency: item.urgency,
        source: item.source,
        createdAt: item.createdAt,
        isResolved: item.isResolved,
        customerName: item.customerName
      }))
    }
  });
}));

// Get dashboard widgets
router.get('/widgets', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get widget configurations from user preferences
  const userPreferences = req.user.preferences?.dashboard?.widgets || [];
  
  // Default widgets if none configured
  const defaultWidgets = [
    { id: 'sentiment-overview', type: 'chart', title: 'Sentiment Overview', enabled: true },
    { id: 'recent-feedback', type: 'list', title: 'Recent Feedback', enabled: true },
    { id: 'source-distribution', type: 'chart', title: 'Source Distribution', enabled: true },
    { id: 'urgency-alerts', type: 'alerts', title: 'Urgency Alerts', enabled: true },
    { id: 'ai-insights', type: 'insights', title: 'AI Insights', enabled: true }
  ];

  const widgets = userPreferences.length > 0 ? userPreferences : defaultWidgets;

  res.json({
    widgets: widgets.filter(widget => widget.enabled)
  });
}));

// Update dashboard widget configuration
router.put('/widgets', [
  require('express-validator').body('widgets').isArray()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { widgets } = req.body;

  // Update user preferences
  const currentPreferences = req.user.preferences || {};
  currentPreferences.dashboard = currentPreferences.dashboard || {};
  currentPreferences.dashboard.widgets = widgets;

  await req.user.update({
    preferences: currentPreferences
  });

  res.json({
    message: 'Widget configuration updated successfully',
    widgets
  });
}));

// Get real-time dashboard updates
router.get('/realtime', asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const lastUpdate = req.query.lastUpdate;

  const whereClause = { userId };
  if (lastUpdate) {
    whereClause.updatedAt = { [Op.gt]: new Date(lastUpdate) };
  }

  // Get recent updates
  const recentUpdates = await Feedback.findAll({
    where: whereClause,
    order: [['updatedAt', 'DESC']],
    limit: 20,
    attributes: [
      'id',
      'content',
      'sentiment',
      'urgency',
      'source',
      'updatedAt',
      'isResolved'
    ]
  });

  // Get real-time metrics
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const hourlyStats = await Feedback.findAll({
    where: {
      userId,
      createdAt: { [Op.gte]: oneHourAgo }
    },
    attributes: [
      'sentiment',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['sentiment']
  });

  res.json({
    lastUpdate: now.toISOString(),
    recentUpdates: recentUpdates.map(update => ({
      id: update.id,
      content: update.content.substring(0, 50) + '...',
      sentiment: update.sentiment,
      urgency: update.urgency,
      source: update.source,
      updatedAt: update.updatedAt,
      isResolved: update.isResolved
    })),
    hourlyStats: hourlyStats.map(stat => ({
      sentiment: stat.sentiment,
      count: parseInt(stat.dataValues.count)
    }))
  });
}));

// Get dashboard alerts
router.get('/alerts', asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get urgent feedback that needs attention
  const urgentAlerts = await Feedback.findAll({
    where: {
      userId,
      urgency: { [Op.in]: ['high', 'critical'] },
      isResolved: false
    },
    order: [['createdAt', 'DESC']],
    limit: 10
  });

  // Get negative sentiment spikes
  const last24Hours = new Date();
  last24Hours.setDate(last24Hours.getDate() - 1);
  
  const negativeSpike = await Feedback.count({
    where: {
      userId,
      sentiment: 'negative',
      createdAt: { [Op.gte]: last24Hours }
    }
  });

  // Get unresolved feedback count
  const unresolvedCount = await Feedback.count({
    where: {
      userId,
      isResolved: false
    }
  });

  const alerts = [];

  // Add urgent feedback alerts
  urgentAlerts.forEach(feedback => {
    alerts.push({
      id: `urgent-${feedback.id}`,
      type: 'urgent',
      title: 'Urgent Feedback',
      message: `High priority feedback from ${feedback.source}`,
      severity: feedback.urgency === 'critical' ? 'critical' : 'high',
      feedbackId: feedback.id,
      createdAt: feedback.createdAt
    });
  });

  // Add negative sentiment spike alert
  if (negativeSpike > 10) {
    alerts.push({
      id: 'negative-spike',
      type: 'sentiment',
      title: 'Negative Sentiment Spike',
      message: `${negativeSpike} negative feedback items in the last 24 hours`,
      severity: 'medium',
      createdAt: new Date()
    });
  }

  // Add unresolved feedback alert
  if (unresolvedCount > 50) {
    alerts.push({
      id: 'unresolved-high',
      type: 'unresolved',
      title: 'High Unresolved Feedback',
      message: `${unresolvedCount} unresolved feedback items`,
      severity: 'medium',
      createdAt: new Date()
    });
  }

  res.json({
    alerts: alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  });
}));

// Mark alert as read
router.post('/alerts/:alertId/read', asyncHandler(async (req, res) => {
  const { alertId } = req.params;

  // TODO: Implement alert read status tracking
  // For now, just return success

  res.json({
    message: 'Alert marked as read',
    alertId
  });
}));

// Get dashboard export data
router.get('/export', [
  query('format').isIn(['json', 'csv', 'xlsx']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { format, dateFrom, dateTo } = req.query;
  const whereClause = { userId: req.user.id };

  // Date range filter
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
  }

  const feedback = await Feedback.findAll({
    where: whereClause,
    order: [['createdAt', 'DESC']]
  });

  const exportData = feedback.map(item => ({
    id: item.id,
    content: item.content,
    sentiment: item.sentiment,
    sentimentScore: item.sentiment === 'positive' ? 1 : item.sentiment === 'negative' ? -1 : 0,
    urgency: item.urgency,
    source: item.source,
    customerName: item.customerName,
    customerEmail: item.customerEmail,
    rating: item.rating,
    isResolved: item.isResolved,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }));

  if (format === 'json') {
    res.json({
      export: {
        format: 'json',
        data: exportData,
        totalRecords: exportData.length,
        exportedAt: new Date().toISOString()
      }
    });
  } else {
    // TODO: Implement CSV and XLSX export
    res.json({
      message: `${format.toUpperCase()} export not yet implemented`,
      totalRecords: exportData.length
    });
  }
}));

// Get dashboard settings
router.get('/settings', asyncHandler(async (req, res) => {
  const dashboardSettings = req.user.preferences?.dashboard || {
    defaultView: 'overview',
    refreshInterval: 300,
    widgets: [],
    theme: 'light'
  };

  res.json({
    settings: dashboardSettings
  });
}));

// Update dashboard settings
router.put('/settings', [
  require('express-validator').body('settings').isObject()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { settings } = req.body;

  // Update user preferences
  const currentPreferences = req.user.preferences || {};
  currentPreferences.dashboard = { ...currentPreferences.dashboard, ...settings };

  await req.user.update({
    preferences: currentPreferences
  });

  res.json({
    message: 'Dashboard settings updated successfully',
    settings: currentPreferences.dashboard
  });
}));

module.exports = router; 