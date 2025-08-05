const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const Feedback = require('../models/Feedback');
const aiService = require('../services/aiService');
const { redisClient } = require('../config/database');
const { Op } = require('sequelize');

const router = express.Router();

// General analytics endpoint
router.get('/', [
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

  const { timeRange = '30d', source, dateFrom, dateTo } = req.query;
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    whereClause.createdAt = { [Op.gte]: startDate };
  }

  // Custom date range filter
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
  }

  // Get feedback statistics
  const totalFeedback = await Feedback.count({ where: whereClause });
  const positiveFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'positive' } });
  const negativeFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'negative' } });
  const neutralFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'neutral' } });

  // Get average sentiment score
  const avgSentimentResult = await Feedback.findOne({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ]
  });

  // Get sentiment distribution
  const sentimentStats = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'sentiment',
      [require('sequelize').fn('COUNT', require('sequelize').col('sentiment')), 'count']
    ],
    group: ['sentiment']
  });

  // Get urgency distribution
  const urgencyStats = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'urgency',
      [require('sequelize').fn('COUNT', require('sequelize').col('urgency')), 'count']
    ],
    group: ['urgency']
  });

  // Get source distribution
  const sourceStats = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'source',
      [require('sequelize').fn('COUNT', require('sequelize').col('source')), 'count']
    ],
    group: ['source']
  });

  // Get trends data
  const trends = await Feedback.findAll({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 END')), 'positive'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'negative\' THEN 1 END')), 'negative'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'neutral\' THEN 1 END')), 'neutral']
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'ASC']]
  });

  // Get top categories
  const topCategories = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'categories',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['categories'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
    limit: 5
  });

  res.json({
    analytics: {
      overview: {
        totalFeedback,
        positive: positiveFeedback,
        negative: negativeFeedback,
        neutral: neutralFeedback,
        avgSentimentScore: parseFloat(avgSentimentResult?.dataValues.avgSentiment || 0),
        sentimentDistribution: sentimentStats.reduce((acc, stat) => {
          acc[stat.sentiment] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        urgencyDistribution: urgencyStats.reduce((acc, stat) => {
          acc[stat.urgency] = parseInt(stat.dataValues.count);
          return acc;
        }, {}),
        sourceDistribution: sourceStats.reduce((acc, stat) => {
          acc[stat.source] = parseInt(stat.dataValues.count);
          return acc;
        }, {})
      },
      trends: trends.map(trend => ({
        date: trend.dataValues.date,
        total: parseInt(trend.dataValues.total),
        avgSentiment: parseFloat(trend.dataValues.avgSentiment || 0),
        positive: parseInt(trend.dataValues.positive),
        negative: parseInt(trend.dataValues.negative),
        neutral: parseInt(trend.dataValues.neutral)
      })),
      topCategories: topCategories.map(cat => ({
        category: cat.dataValues.categories,
        count: parseInt(cat.dataValues.count)
      })),
      filters: {
        timeRange,
        source: source || 'all',
        dateFrom,
        dateTo
      }
    }
  });
}));

// Get dashboard overview metrics
router.get('/overview', [
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

  // Get total feedback count
  const totalFeedback = await Feedback.count({ where: whereClause });

  // Get sentiment distribution
  const sentimentStats = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'sentiment',
      [require('sequelize').fn('COUNT', require('sequelize').col('sentiment')), 'count']
    ],
    group: ['sentiment']
  });

  // Get urgency distribution
  const urgencyStats = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'urgency',
      [require('sequelize').fn('COUNT', require('sequelize').col('urgency')), 'count']
    ],
    group: ['urgency']
  });

  // Get source distribution
  const sourceStats = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'source',
      [require('sequelize').fn('COUNT', require('sequelize').col('source')), 'count']
    ],
    group: ['source']
  });

  // Get average sentiment score (using sentiment instead of sentimentScore)
  const avgSentiment = await Feedback.findOne({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ]
  });

  // Get resolution rate
  const resolvedCount = await Feedback.count({
    where: { ...whereClause, isResolved: true }
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

  // Get flagged feedback count
  const flaggedCount = await Feedback.count({
    where: { ...whereClause, isFlagged: true }
  });

  res.json({
    overview: {
      totalFeedback,
      sentimentDistribution: sentimentStats.reduce((acc, stat) => {
        acc[stat.sentiment] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      urgencyDistribution: urgencyStats.reduce((acc, stat) => {
        acc[stat.urgency] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      sourceDistribution: sourceStats.reduce((acc, stat) => {
        acc[stat.source] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      avgSentimentScore: parseFloat(avgSentiment?.dataValues.avgSentiment || 0),
      resolutionRate: totalFeedback > 0 ? (resolvedCount / totalFeedback) * 100 : 0,
      recentFeedback,
      flaggedCount
    }
  });
}));

// Get sentiment trends over time
router.get('/sentiment-trends', [
  query('period').isIn(['daily', 'weekly', 'monthly']),
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

  const { period, dateFrom, dateTo } = req.query;
  const whereClause = { userId: req.user.id };

  // Date range filter
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
  }

  let dateFormat, groupBy;
  switch (period) {
    case 'daily':
      dateFormat = 'YYYY-MM-DD';
      groupBy = require('sequelize').fn('DATE', require('sequelize').col('created_at'));
      break;
    case 'weekly':
      dateFormat = 'YYYY-WW';
      groupBy = require('sequelize').fn('DATE_TRUNC', 'week', require('sequelize').col('created_at'));
      break;
    case 'monthly':
      dateFormat = 'YYYY-MM';
      groupBy = require('sequelize').fn('DATE_TRUNC', 'month', require('sequelize').col('created_at'));
      break;
  }

  const trends = await Feedback.findAll({
    where: whereClause,
    attributes: [
      [groupBy, 'period'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 END')), 'positive'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'negative\' THEN 1 END')), 'negative'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'neutral\' THEN 1 END')), 'neutral']
    ],
    group: ['period'],
    order: [[groupBy, 'ASC']]
  });

  res.json({
    trends: trends.map(trend => ({
      period: trend.dataValues.period,
      total: parseInt(trend.dataValues.total),
      avgSentiment: parseFloat(trend.dataValues.avgSentiment || 0),
      positive: parseInt(trend.dataValues.positive),
      negative: parseInt(trend.dataValues.negative),
      neutral: parseInt(trend.dataValues.neutral)
    }))
  });
}));

// Get top categories and topics
router.get('/categories', [
  query('limit').optional().isInt({ min: 1, max: 50 }),
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

  const { limit = 10, dateFrom, dateTo } = req.query;
  const whereClause = { userId: req.user.id };

  // Date range filter
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt[Op.gte] = new Date(dateFrom);
    if (dateTo) whereClause.createdAt[Op.lte] = new Date(dateTo);
  }

  // Get category distribution
  const categories = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'categories',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['categories'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
    limit: parseInt(limit)
  });

  // Get tag distribution
  const tags = await Feedback.findAll({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('JSONB_ARRAY_ELEMENTS', require('sequelize').col('tags')), 'tag'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['tag'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
    limit: parseInt(limit)
  });

  res.json({
    categories: categories.map(cat => ({
      category: cat.dataValues.categories,
      count: parseInt(cat.dataValues.count)
    })),
    tags: tags.map(tag => ({
      tag: tag.dataValues.tag,
      count: parseInt(tag.dataValues.count)
    }))
  });
}));

// Get AI-generated insights
router.get('/insights', [
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

  // Get feedback statistics
  const totalFeedback = await Feedback.count({ where: whereClause });
  const positiveFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'positive' } });
  const negativeFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'negative' } });
  const neutralFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'neutral' } });

  // Get average sentiment score (using sentiment instead of sentimentScore)
  const avgSentimentResult = await Feedback.findOne({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ]
  });

  // Get top categories
  const topCategories = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'categories',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['categories'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
    limit: 5
  });

  // Get recent trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentTrends = await Feedback.findAll({
    where: {
      ...whereClause,
      createdAt: { [Op.gte]: thirtyDaysAgo }
    },
    attributes: [
      'sentiment',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['sentiment']
  });

  const feedbackData = {
    total: totalFeedback,
    positive: positiveFeedback,
    negative: negativeFeedback,
    neutral: neutralFeedback,
    avgSentiment: parseFloat(avgSentimentResult?.dataValues.avgSentiment || 0),
    topCategories: topCategories.map(cat => cat.dataValues.categories),
    recentTrends: recentTrends.map(trend => `${trend.sentiment}: ${trend.dataValues.count} mentions`)
  };

  // Generate AI insights
  const insights = await aiService.generateInsights(feedbackData);

  res.json({
    insights,
    data: feedbackData
  });
}));

// Get source performance metrics
router.get('/source-performance', [
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

  const sourcePerformance = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'source',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 END')), 'positive'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'negative\' THEN 1 END')), 'negative'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN isResolved = true THEN 1 END')), 'resolved']
    ],
    group: ['source'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']]
  });

  res.json({
    sourcePerformance: sourcePerformance.map(source => ({
      source: source.dataValues.source,
      total: parseInt(source.dataValues.total),
      avgSentiment: parseFloat(source.dataValues.avgSentiment || 0),
      positive: parseInt(source.dataValues.positive),
      negative: parseInt(source.dataValues.negative),
      resolved: parseInt(source.dataValues.resolved),
      resolutionRate: parseInt(source.dataValues.total) > 0 ? 
        (parseInt(source.dataValues.resolved) / parseInt(source.dataValues.total)) * 100 : 0
    }))
  });
}));

// Get urgency analysis
router.get('/urgency-analysis', [
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

  const urgencyAnalysis = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'urgency',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN isResolved = true THEN 1 END')), 'resolved']
    ],
    group: ['urgency'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']]
  });

  res.json({
    urgencyAnalysis: urgencyAnalysis.map(urgency => ({
      urgency: urgency.dataValues.urgency,
      count: parseInt(urgency.dataValues.count),
      avgSentiment: parseFloat(urgency.dataValues.avgSentiment || 0),
      resolved: parseInt(urgency.dataValues.resolved),
      resolutionRate: parseInt(urgency.dataValues.count) > 0 ? 
        (parseInt(urgency.dataValues.resolved) / parseInt(urgency.dataValues.count)) * 100 : 0
    }))
  });
}));

// Get weekly insights (alias for weekly-summary)
router.get('/weekly-insights', asyncHandler(async (req, res) => {
  const cacheKey = `weekly_insights:${req.user.id}`;
  
  // Check cache first
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Get last 7 days data
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  
  const whereClause = {
    userId: req.user.id,
    createdAt: { [Op.gte]: lastWeekDate }
  };

  // Get feedback statistics
  const totalFeedback = await Feedback.count({ where: whereClause });
  const positiveFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'positive' } });
  const negativeFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'negative' } });
  const neutralFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'neutral' } });

  // Get average sentiment score (using sentiment instead of sentimentScore)
  const avgSentimentResult = await Feedback.findOne({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ]
  });

  // Get top issues
  const topIssues = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'categories',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['categories'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
    limit: 5
  });

  // Get trends
  const trends = await Feedback.findAll({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'ASC']]
  });

  const feedbackStats = {
    total: totalFeedback,
    positive: positiveFeedback,
    negative: negativeFeedback,
    neutral: neutralFeedback,
    avgSentiment: parseFloat(avgSentimentResult?.dataValues.avgSentiment || 0)
  };

  const topIssuesData = topIssues.map(issue => ({
    category: issue.dataValues.categories,
    count: parseInt(issue.dataValues.count)
  }));

  const trendsData = trends.map(trend => ({
    date: trend.dataValues.date,
    count: parseInt(trend.dataValues.count),
    avgSentiment: parseFloat(trend.dataValues.avgSentiment || 0)
  }));

  // Generate weekly insights
  const weeklyInsights = await aiService.generateWeeklySummary(feedbackStats, topIssuesData, trendsData);

  const result = {
    period: 'last_7_days',
    insights: weeklyInsights,
    stats: feedbackStats,
    topIssues: topIssuesData,
    trends: trendsData
  };

  // Cache for 1 hour
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

  res.json(result);
}));

// Get trends endpoint (alias for sentiment-trends)
router.get('/trends', [
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

  const trends = await Feedback.findAll({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total'],
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 END')), 'positive'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'negative\' THEN 1 END')), 'negative'],
      [require('sequelize').fn('COUNT', require('sequelize').literal('CASE WHEN sentiment = \'neutral\' THEN 1 END')), 'neutral']
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'ASC']]
  });

  res.json({
    trends: trends.map(trend => ({
      date: trend.dataValues.date,
      total: parseInt(trend.dataValues.total),
      avgSentiment: parseFloat(trend.dataValues.avgSentiment || 0),
      positive: parseInt(trend.dataValues.positive),
      negative: parseInt(trend.dataValues.negative),
      neutral: parseInt(trend.dataValues.neutral)
    }))
  });
}));

// Get weekly summary
router.get('/weekly-summary', asyncHandler(async (req, res) => {
  const cacheKey = `weekly_summary:${req.user.id}`;
  
  // Check cache first
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  // Get last 7 days data
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  
  const whereClause = {
    userId: req.user.id,
    createdAt: { [Op.gte]: lastWeekDate }
  };

  // Get feedback statistics
  const totalFeedback = await Feedback.count({ where: whereClause });
  const positiveFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'positive' } });
  const negativeFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'negative' } });
  const neutralFeedback = await Feedback.count({ where: { ...whereClause, sentiment: 'neutral' } });

  // Get average sentiment score (using sentiment instead of sentimentScore)
  const avgSentimentResult = await Feedback.findOne({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ]
  });

  // Get top issues
  const topIssues = await Feedback.findAll({
    where: whereClause,
    attributes: [
      'categories',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['categories'],
    order: [[require('sequelize').fn('COUNT', require('sequelize').col('id')), 'DESC']],
    limit: 5
  });

  // Get trends
  const trends = await Feedback.findAll({
    where: whereClause,
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
      [require('sequelize').fn('AVG', require('sequelize').literal('CASE WHEN sentiment = \'positive\' THEN 1 WHEN sentiment = \'negative\' THEN -1 ELSE 0 END')), 'avgSentiment']
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'ASC']]
  });

  const feedbackStats = {
    total: totalFeedback,
    positive: positiveFeedback,
    negative: negativeFeedback,
    neutral: neutralFeedback,
    avgSentiment: parseFloat(avgSentimentResult?.dataValues.avgSentiment || 0)
  };

  const topIssuesData = topIssues.map(issue => ({
    category: issue.dataValues.categories,
    count: parseInt(issue.dataValues.count)
  }));

  const trendsData = trends.map(trend => ({
    date: trend.dataValues.date,
    count: parseInt(trend.dataValues.count),
    avgSentiment: parseFloat(trend.dataValues.avgSentiment || 0)
  }));

  // Generate weekly summary
  const weeklySummary = await aiService.generateWeeklySummary(feedbackStats, topIssuesData, trendsData);

  const result = {
    period: 'last_7_days',
    summary: weeklySummary,
    stats: feedbackStats,
    topIssues: topIssuesData,
    trends: trendsData
  };

  // Cache for 1 hour
  await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));

  res.json(result);
}));

module.exports = router; 