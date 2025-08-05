const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const churnPredictionService = require('../services/churnPredictionService');

const router = express.Router();

// Get churn risk prediction for current user
router.get('/risk', [
  authenticateToken,
  query('timeRange').optional().isIn(['30d', '60d', '90d']).withMessage('Invalid time range'),
  query('source').optional().isString().withMessage('Source must be a string'),
  query('includeDetails').optional().isBoolean().withMessage('includeDetails must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange, source, includeDetails } = req.query;

  const result = await churnPredictionService.predictChurnRisk(req.user.id, {
    timeRange,
    source,
    includeDetails
  });

  res.json({
    success: true,
    data: result
  });
}));

// Get churn risk for specific customer (by email)
router.get('/customer/:email', [
  authenticateToken,
  query('timeRange').optional().isIn(['30d', '60d', '90d']).withMessage('Invalid time range'),
  query('source').optional().isString().withMessage('Source must be a string'),
  query('includeDetails').optional().isBoolean().withMessage('includeDetails must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { email } = req.params;
  const { timeRange, source, includeDetails } = req.query;

  // For now, we'll use the current user's data
  // In a real implementation, you'd filter by customer email
  const result = await churnPredictionService.predictChurnRisk(req.user.id, {
    timeRange,
    source,
    includeDetails
  });

  res.json({
    success: true,
    data: {
      customerEmail: email,
      ...result
    }
  });
}));

// Get churn risk levels metadata
router.get('/risk-levels', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const riskLevels = Object.values(churnPredictionService.riskLevels);
  const metadata = riskLevels.map(level => ({
    id: level,
    ...churnPredictionService.getRiskLevelMetadata(level)
  }));
  
  res.json({
    success: true,
    data: metadata
  });
}));

// Get churn factors metadata
router.get('/factors', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const factors = Object.values(churnPredictionService.churnFactors);
  const factorMetadata = {
    [churnPredictionService.churnFactors.NEGATIVE_SENTIMENT]: {
      name: 'Negative Sentiment',
      description: 'Customer expressing dissatisfaction or negative emotions',
      weight: 30,
      icon: 'frown'
    },
    [churnPredictionService.churnFactors.DECREASING_ENGAGEMENT]: {
      name: 'Decreasing Engagement',
      description: 'Reduced interaction and feedback activity',
      weight: 25,
      icon: 'trending-down'
    },
    [churnPredictionService.churnFactors.SUPPORT_ISSUES]: {
      name: 'Support Issues',
      description: 'Unresolved high-priority support problems',
      weight: 20,
      icon: 'help-circle'
    },
    [churnPredictionService.churnFactors.FEATURE_REQUESTS]: {
      name: 'Feature Requests vs Complaints',
      description: 'Ratio of feature requests to complaints',
      weight: 15,
      icon: 'settings'
    },
    [churnPredictionService.churnFactors.COMPETITOR_MENTIONS]: {
      name: 'Competitor Mentions',
      description: 'References to competitors or alternatives',
      weight: 10,
      icon: 'users'
    }
  };
  
  const factorsWithMetadata = factors.map(factor => ({
    id: factor,
    ...factorMetadata[factor]
  }));
  
  res.json({
    success: true,
    data: factorsWithMetadata
  });
}));

// Get churn analytics (aggregated risk data)
router.get('/analytics', [
  authenticateToken,
  query('timeRange').optional().isIn(['30d', '60d', '90d']).withMessage('Invalid time range'),
  query('source').optional().isString().withMessage('Source must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange, source } = req.query;

  // Get current user's churn prediction
  const userPrediction = await churnPredictionService.predictChurnRisk(req.user.id, {
    timeRange,
    source,
    includeDetails: true
  });

  // Mock analytics data (in a real implementation, you'd aggregate across all customers)
  const analytics = {
    overallRisk: {
      score: userPrediction.riskScore,
      level: userPrediction.riskLevel,
      trend: 'stable' // Would be calculated from historical data
    },
    riskDistribution: {
      low: 60, // Mock percentages
      medium: 25,
      high: 10,
      critical: 5
    },
    topChurnFactors: userPrediction.churnFactors.map(factor => ({
      type: factor.type,
      count: factor.count || 1,
      severity: factor.severity
    })),
    retentionMetrics: {
      averageRetentionProbability: userPrediction.retentionProbability,
      predictedChurnRate: 100 - userPrediction.retentionProbability,
      retentionTrend: 'improving' // Would be calculated from historical data
    },
    predictions: {
      next30Days: {
        lowRisk: 85,
        mediumRisk: 10,
        highRisk: 3,
        criticalRisk: 2
      },
      next60Days: {
        lowRisk: 80,
        mediumRisk: 15,
        highRisk: 3,
        criticalRisk: 2
      },
      next90Days: {
        lowRisk: 75,
        mediumRisk: 20,
        highRisk: 3,
        criticalRisk: 2
      }
    }
  };

  res.json({
    success: true,
    data: {
      analytics,
      metadata: {
        timeRange,
        source,
        analysisDate: new Date()
      }
    }
  });
}));

// Get churn prevention recommendations
router.get('/recommendations', [
  authenticateToken,
  query('timeRange').optional().isIn(['30d', '60d', '90d']).withMessage('Invalid time range'),
  query('source').optional().isString().withMessage('Source must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange, source } = req.query;

  const userPrediction = await churnPredictionService.predictChurnRisk(req.user.id, {
    timeRange,
    source,
    includeDetails: true
  });

  const recommendations = {
    immediate: userPrediction.details?.recommendations?.filter(r => r.priority === 'critical') || [],
    high: userPrediction.details?.recommendations?.filter(r => r.priority === 'high') || [],
    medium: userPrediction.details?.recommendations?.filter(r => r.priority === 'medium') || [],
    low: userPrediction.details?.recommendations?.filter(r => r.priority === 'low') || [],
    general: [
      {
        category: 'engagement',
        action: 'Increase proactive communication',
        description: 'Regular check-ins and updates to maintain engagement',
        impact: 'high'
      },
      {
        category: 'support',
        action: 'Improve response times',
        description: 'Faster resolution of support issues',
        impact: 'medium'
      },
      {
        category: 'features',
        action: 'Prioritize requested features',
        description: 'Address high-demand feature requests',
        impact: 'high'
      }
    ]
  };

  res.json({
    success: true,
    data: {
      recommendations,
      riskLevel: userPrediction.riskLevel,
      riskScore: userPrediction.riskScore,
      metadata: {
        timeRange,
        source,
        analysisDate: new Date()
      }
    }
  });
}));

// Get churn prediction history (mock data)
router.get('/history', [
  authenticateToken,
  query('timeRange').optional().isIn(['30d', '60d', '90d']).withMessage('Invalid time range'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange, page = 1, limit = 20 } = req.query;

  // Mock history data
  const history = [
    {
      id: '1',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      riskScore: 45,
      riskLevel: 'medium',
      factors: ['decreasing_engagement', 'support_issues'],
      accuracy: 85
    },
    {
      id: '2',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      riskScore: 52,
      riskLevel: 'medium',
      factors: ['negative_sentiment'],
      accuracy: 78
    },
    {
      id: '3',
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      riskScore: 38,
      riskLevel: 'low',
      factors: [],
      accuracy: 92
    }
  ];

  res.json({
    success: true,
    data: {
      history: history.slice((page - 1) * limit, page * limit),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.length,
        pages: Math.ceil(history.length / limit)
      },
      metadata: {
        timeRange,
        analysisDate: new Date()
      }
    }
  });
}));

// Get churn prediction accuracy metrics
router.get('/accuracy', [
  authenticateToken,
  query('timeRange').optional().isIn(['30d', '60d', '90d']).withMessage('Invalid time range')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange } = req.query;

  // Mock accuracy metrics
  const accuracy = {
    overall: 87.5,
    byRiskLevel: {
      low: 94.2,
      medium: 85.1,
      high: 78.3,
      critical: 72.8
    },
    byFactor: {
      negative_sentiment: 89.1,
      decreasing_engagement: 83.4,
      support_issues: 91.2,
      feature_requests: 76.8,
      competitor_mentions: 88.9
    },
    trends: {
      last30Days: 89.2,
      last60Days: 87.1,
      last90Days: 85.8
    },
    predictions: {
      total: 1250,
      accurate: 1094,
      falsePositives: 89,
      falseNegatives: 67
    }
  };

  res.json({
    success: true,
    data: {
      accuracy,
      metadata: {
        timeRange,
        analysisDate: new Date()
      }
    }
  });
}));

// Get early warning signals
router.get('/early-warnings', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '14d', '30d']).withMessage('Invalid time range')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange } = req.query;

  // Mock early warning signals
  const warnings = [
    {
      id: '1',
      type: 'sentiment_decline',
      severity: 'medium',
      description: 'Sentiment score decreased by 15% in the last 7 days',
      detectedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      confidence: 78
    },
    {
      id: '2',
      type: 'engagement_drop',
      severity: 'high',
      description: 'No feedback activity for 21 days',
      detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      confidence: 85
    },
    {
      id: '3',
      type: 'support_escalation',
      severity: 'critical',
      description: 'Multiple high-priority support tickets opened',
      detectedAt: new Date(),
      confidence: 92
    }
  ];

  res.json({
    success: true,
    data: {
      warnings,
      metadata: {
        timeRange,
        analysisDate: new Date()
      }
    }
  });
}));

module.exports = router; 