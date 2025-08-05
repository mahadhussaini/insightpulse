const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const competitorAnalysisService = require('../services/competitorAnalysisService');

const router = express.Router();

// Get competitor analysis overview
router.get('/overview', [
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
  const analysis = await competitorAnalysisService.analyzeCompetitorMentions(req.user.id, timeRange);

  res.json({
    success: analysis.success,
    data: analysis.data
  });
}));

// Get competitor list
router.get('/competitors', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const competitors = competitorAnalysisService.getCompetitorList();

  res.json({
    success: true,
    data: competitors
  });
}));

// Get category list
router.get('/categories', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const categories = competitorAnalysisService.getCategoryList();

  res.json({
    success: true,
    data: categories
  });
}));

// Get competitor comparison
router.get('/comparison', [
  authenticateToken,
  query('competitors').isArray().withMessage('Competitors must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { competitors } = req.query;
  const comparison = await competitorAnalysisService.getCompetitorComparison(req.user.id, competitors);

  res.json({
    success: comparison.success,
    data: comparison.data
  });
}));

// Get competitor details
router.get('/competitor/:competitorId', [
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

  const { competitorId } = req.params;
  const { timeRange = '30d' } = req.query;

  const analysis = await competitorAnalysisService.analyzeCompetitorMentions(req.user.id, timeRange);
  
  if (!analysis.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not analyze competitor mentions'
    });
  }

  const competitor = analysis.data.competitors[competitorId];
  
  if (!competitor) {
    return res.status(404).json({
      success: false,
      error: 'Competitor not found'
    });
  }

  res.json({
    success: true,
    data: {
      competitor,
      mentions: competitor.mentions,
      trends: analysis.data.trends,
      insights: analysis.data.insights.filter(i => i.competitor === competitorId),
      recommendations: analysis.data.recommendations.filter(r => r.competitor === competitorId)
    }
  });
}));

// Get category analysis
router.get('/category/:categoryId', [
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

  const { categoryId } = req.params;
  const { timeRange = '30d' } = req.query;

  const analysis = await competitorAnalysisService.analyzeCompetitorMentions(req.user.id, timeRange);
  
  if (!analysis.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not analyze competitor mentions'
    });
  }

  const category = analysis.data.categories[categoryId];
  
  if (!category) {
    return res.status(404).json({
      success: false,
      error: 'Category not found'
    });
  }

  // Get competitors in this category
  const categoryCompetitors = {};
  category.competitors.forEach(competitorId => {
    if (analysis.data.competitors[competitorId]) {
      categoryCompetitors[competitorId] = analysis.data.competitors[competitorId];
    }
  });

  res.json({
    success: true,
    data: {
      category,
      competitors: categoryCompetitors,
      trends: analysis.data.trends,
      insights: analysis.data.insights.filter(i => i.category === categoryId),
      recommendations: analysis.data.recommendations.filter(r => r.category === categoryId)
    }
  });
}));

// Get competitor trends
router.get('/trends', [
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
  const analysis = await competitorAnalysisService.analyzeCompetitorMentions(req.user.id, timeRange);

  res.json({
    success: analysis.success,
    data: analysis.data.trends
  });
}));

// Get competitor insights
router.get('/insights', [
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
  const analysis = await competitorAnalysisService.analyzeCompetitorMentions(req.user.id, timeRange);

  res.json({
    success: analysis.success,
    data: analysis.data.insights
  });
}));

// Get competitor recommendations
router.get('/recommendations', [
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
  const analysis = await competitorAnalysisService.analyzeCompetitorMentions(req.user.id, timeRange);

  res.json({
    success: analysis.success,
    data: analysis.data.recommendations
  });
}));

// Get competitor mentions
router.get('/mentions', [
  authenticateToken,
  query('competitor').optional().isString().withMessage('Competitor must be a string'),
  query('timeRange').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid time range'),
  query('sentiment').optional().isIn(['positive', 'negative', 'neutral', 'mixed']).withMessage('Invalid sentiment')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { competitor, timeRange = '30d', sentiment } = req.query;
  const analysis = await competitorAnalysisService.analyzeCompetitorMentions(req.user.id, timeRange);

  if (!analysis.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not analyze competitor mentions'
    });
  }

  let mentions = [];
  
  // Collect all mentions
  Object.values(analysis.data.competitors).forEach(competitorData => {
    mentions = mentions.concat(competitorData.mentions);
  });

  // Filter by competitor if specified
  if (competitor) {
    mentions = mentions.filter(mention => mention.competitor === competitor);
  }

  // Filter by sentiment if specified
  if (sentiment) {
    mentions = mentions.filter(mention => mention.sentiment === sentiment);
  }

  // Sort by date
  mentions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    data: {
      mentions,
      total: mentions.length,
      filters: { competitor, timeRange, sentiment }
    }
  });
}));

// Get competitor statistics
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
  const analysis = await competitorAnalysisService.analyzeCompetitorMentions(req.user.id, timeRange);

  if (!analysis.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not analyze competitor mentions'
    });
  }

  const stats = {
    totalMentions: analysis.data.totalMentions,
    totalCompetitors: Object.keys(analysis.data.competitors).length,
    totalCategories: Object.keys(analysis.data.categories).length,
    topCompetitor: Object.entries(analysis.data.competitors)
      .sort(([,a], [,b]) => b.totalMentions - a.totalMentions)[0],
    sentimentDistribution: {
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0
    },
    categoryDistribution: {}
  };

  // Calculate sentiment distribution
  Object.values(analysis.data.competitors).forEach(competitor => {
    Object.entries(competitor.sentiment).forEach(([sentiment, count]) => {
      stats.sentimentDistribution[sentiment] += count;
    });
  });

  // Calculate category distribution
  Object.entries(analysis.data.categories).forEach(([category, data]) => {
    stats.categoryDistribution[category] = data.totalMentions;
  });

  res.json({
    success: true,
    data: stats
  });
}));

// Get competitor alerts
router.get('/alerts', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const analysis = await competitorAnalysisService.analyzeCompetitorMentions(req.user.id, '30d');

  if (!analysis.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not analyze competitor mentions'
    });
  }

  const alerts = [];

  // High mention volume alerts
  Object.entries(analysis.data.competitors).forEach(([competitor, data]) => {
    if (data.totalMentions > 10) {
      alerts.push({
        type: 'high_mentions',
        title: `High mention volume for ${data.name}`,
        description: `${data.totalMentions} mentions in the last 30 days`,
        priority: 'medium',
        competitor
      });
    }
  });

  // Negative sentiment alerts
  Object.entries(analysis.data.competitors).forEach(([competitor, data]) => {
    if (data.sentiment.negative > data.sentiment.positive && data.totalMentions > 5) {
      alerts.push({
        type: 'negative_sentiment',
        title: `Negative sentiment towards ${data.name}`,
        description: `${data.sentiment.negative} negative vs ${data.sentiment.positive} positive mentions`,
        priority: 'high',
        competitor
      });
    }
  });

  // Category trend alerts
  Object.entries(analysis.data.categories).forEach(([category, data]) => {
    if (data.totalMentions > 20) {
      alerts.push({
        type: 'category_trend',
        title: `${data.name} category trending`,
        description: `${data.totalMentions} mentions in this category`,
        priority: 'medium',
        category
      });
    }
  });

  res.json({
    success: true,
    data: alerts
  });
}));

module.exports = router; 