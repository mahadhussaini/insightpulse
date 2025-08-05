const express = require('express');
const { query, body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const reportingService = require('../services/reportingService');

const router = express.Router();

// Generate executive summary report
router.get('/executive-summary', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '30d', '90d', '180d', '1y']).withMessage('Invalid time range')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange = '30d' } = req.query;
  const report = await reportingService.generateExecutiveSummary(req.user.id, timeRange);

  res.json({
    success: report.success,
    data: report.data
  });
}));

// Generate customer satisfaction report
router.get('/customer-satisfaction', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '30d', '90d', '180d', '1y']).withMessage('Invalid time range')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange = '30d' } = req.query;
  const report = await reportingService.generateCustomerSatisfactionReport(req.user.id, timeRange);

  res.json({
    success: report.success,
    data: report.data
  });
}));

// Generate feedback trends report
router.get('/feedback-trends', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '30d', '90d', '180d', '1y']).withMessage('Invalid time range')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange = '90d' } = req.query;
  const report = await reportingService.generateFeedbackTrendsReport(req.user.id, timeRange);

  res.json({
    success: report.success,
    data: report.data
  });
}));

// Generate custom report
router.post('/custom', [
  authenticateToken,
  body('timeRange').isIn(['7d', '30d', '90d', '180d', '1y']).withMessage('Invalid time range'),
  body('metrics').isArray().withMessage('Metrics must be an array'),
  body('filters').optional().isObject().withMessage('Filters must be an object'),
  body('format').optional().isIn(['json', 'csv', 'excel', 'pdf']).withMessage('Invalid export format')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { timeRange, metrics, filters = {}, format = 'json' } = req.body;
  const config = { timeRange, metrics, filters, format };
  
  const report = await reportingService.generateCustomReport(req.user.id, config);

  res.json({
    success: report.success,
    data: report.data
  });
}));

// Export report
router.post('/export', [
  authenticateToken,
  body('reportData').isObject().withMessage('Report data must be an object'),
  body('format').isIn(['json', 'csv', 'excel', 'pdf']).withMessage('Invalid export format')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { reportData, format } = req.body;
  const exportResult = await reportingService.exportReport(reportData, format);

  res.json({
    success: exportResult.success,
    data: exportResult.data
  });
}));

// Get available report types
router.get('/types', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const reportTypes = Object.entries(reportingService.reportTypes).map(([key, value]) => ({
    id: value,
    name: value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: this.getReportTypeDescription(value),
    timeRanges: ['7d', '30d', '90d', '180d', '1y'],
    exportFormats: ['json', 'csv', 'excel', 'pdf']
  }));

  res.json({
    success: true,
    data: reportTypes
  });
}));

// Get available time ranges
router.get('/time-ranges', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const timeRanges = Object.entries(reportingService.timeRanges).map(([key, value]) => ({
    id: key,
    name: value,
    days: this.getDaysFromTimeRange(key)
  }));

  res.json({
    success: true,
    data: timeRanges
  });
}));

// Get available export formats
router.get('/export-formats', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const exportFormats = Object.entries(reportingService.exportFormats).map(([key, value]) => ({
    id: value,
    name: value.toUpperCase(),
    description: this.getExportFormatDescription(value),
    fileExtension: this.getFileExtension(value)
  }));

  res.json({
    success: true,
    data: exportFormats
  });
}));

// Get report templates
router.get('/templates', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const templates = [
    {
      id: 'executive_summary',
      name: 'Executive Summary',
      description: 'High-level overview of key metrics and insights',
      timeRange: '30d',
      metrics: ['totalFeedback', 'satisfactionRate', 'responseRate', 'averageSentiment'],
      category: 'overview'
    },
    {
      id: 'customer_satisfaction',
      name: 'Customer Satisfaction',
      description: 'Detailed analysis of customer satisfaction and NPS',
      timeRange: '30d',
      metrics: ['satisfactionRate', 'nps', 'sentimentTrends', 'customerSegments'],
      category: 'satisfaction'
    },
    {
      id: 'feedback_trends',
      name: 'Feedback Trends',
      description: 'Analysis of feedback patterns and forecasting',
      timeRange: '90d',
      metrics: ['volumeTrends', 'sentimentTrends', 'categoryTrends', 'forecasting'],
      category: 'trends'
    },
    {
      id: 'competitive_analysis',
      name: 'Competitive Analysis',
      description: 'Competitor mentions and market positioning',
      timeRange: '90d',
      metrics: ['competitorMentions', 'competitivePositioning', 'marketTrends'],
      category: 'competitive'
    },
    {
      id: 'churn_analysis',
      name: 'Churn Analysis',
      description: 'Churn indicators and retention strategies',
      timeRange: '90d',
      metrics: ['churnIndicators', 'churnPredictions', 'retentionStrategies'],
      category: 'churn'
    }
  ];

  res.json({
    success: true,
    data: templates
  });
}));

// Get report history
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

  const { limit = 20 } = req.query;

  // Mock report history
  const history = [
    {
      id: '1',
      reportType: 'executive_summary',
      name: 'Executive Summary - March 2024',
      generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      timeRange: '30d',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: '2',
      reportType: 'customer_satisfaction',
      name: 'Customer Satisfaction - Q1 2024',
      generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      timeRange: '90d',
      status: 'completed',
      downloadUrl: '#'
    },
    {
      id: '3',
      reportType: 'feedback_trends',
      name: 'Feedback Trends - February 2024',
      generatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14), // 14 days ago
      timeRange: '90d',
      status: 'completed',
      downloadUrl: '#'
    }
  ];

  res.json({
    success: true,
    data: {
      reports: history.slice(0, parseInt(limit)),
      total: history.length
    }
  });
}));

// Schedule report
router.post('/schedule', [
  authenticateToken,
  body('reportType').isIn(Object.values(reportingService.reportTypes)).withMessage('Invalid report type'),
  body('timeRange').isIn(['7d', '30d', '90d', '180d', '1y']).withMessage('Invalid time range'),
  body('schedule').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid schedule'),
  body('recipients').optional().isArray().withMessage('Recipients must be an array'),
  body('format').optional().isIn(['json', 'csv', 'excel', 'pdf']).withMessage('Invalid export format')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { reportType, timeRange, schedule, recipients = [], format = 'pdf' } = req.body;

  // Mock scheduling
  const scheduledReport = {
    id: Date.now().toString(),
    reportType,
    timeRange,
    schedule,
    recipients,
    format,
    status: 'scheduled',
    nextRun: this.getNextRunDate(schedule),
    createdAt: new Date()
  };

  res.json({
    success: true,
    data: {
      message: 'Report scheduled successfully',
      scheduledReport
    }
  });
}));

// Get scheduled reports
router.get('/scheduled', [
  authenticateToken
], asyncHandler(async (req, res) => {
  // Mock scheduled reports
  const scheduledReports = [
    {
      id: '1',
      reportType: 'executive_summary',
      name: 'Weekly Executive Summary',
      schedule: 'weekly',
      recipients: ['admin@company.com'],
      format: 'pdf',
      status: 'active',
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) // 7 days ago
    },
    {
      id: '2',
      reportType: 'customer_satisfaction',
      name: 'Monthly Customer Satisfaction',
      schedule: 'monthly',
      recipients: ['ceo@company.com', 'cso@company.com'],
      format: 'excel',
      status: 'active',
      nextRun: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days from now
      lastRun: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30) // 30 days ago
    }
  ];

  res.json({
    success: true,
    data: scheduledReports
  });
}));

// Cancel scheduled report
router.delete('/scheduled/:reportId', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  // Mock cancellation
  res.json({
    success: true,
    data: {
      message: 'Scheduled report cancelled successfully',
      reportId
    }
  });
}));

// Get report statistics
router.get('/stats', [
  authenticateToken
], asyncHandler(async (req, res) => {
  // Mock report statistics
  const stats = {
    totalReports: 156,
    reportsThisMonth: 23,
    mostPopularReport: 'executive_summary',
    averageGenerationTime: 2.3, // seconds
    exportFormats: {
      pdf: 45,
      excel: 38,
      csv: 12,
      json: 5
    },
    scheduledReports: 8,
    activeSchedules: 5
  };

  res.json({
    success: true,
    data: stats
  });
}));

// Helper methods
const getReportTypeDescription = (reportType) => {
  const descriptions = {
    'executive_summary': 'High-level overview of key metrics and insights',
    'customer_satisfaction': 'Detailed analysis of customer satisfaction and NPS',
    'feedback_trends': 'Analysis of feedback patterns and forecasting',
    'competitive_analysis': 'Competitor mentions and market positioning',
    'churn_analysis': 'Churn indicators and retention strategies',
    'integration_performance': 'Integration performance and usage metrics',
    'team_performance': 'Team response times and productivity metrics',
    'custom_report': 'Custom report with user-defined metrics and filters'
  };
  return descriptions[reportType] || 'Custom report';
};

const getExportFormatDescription = (format) => {
  const descriptions = {
    'json': 'Structured data format for API integration',
    'csv': 'Comma-separated values for spreadsheet applications',
    'excel': 'Microsoft Excel format with formatting and charts',
    'pdf': 'Portable Document Format for sharing and printing'
  };
  return descriptions[format] || 'Unknown format';
};

const getFileExtension = (format) => {
  const extensions = {
    'json': '.json',
    'csv': '.csv',
    'excel': '.xlsx',
    'pdf': '.pdf'
  };
  return extensions[format] || '';
};

const getDaysFromTimeRange = (timeRange) => {
  const days = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '1y': 365
  };
  return days[timeRange] || 30;
};

const getNextRunDate = (schedule) => {
  const now = new Date();
  switch (schedule) {
    case 'daily':
      return new Date(now.getTime() + 1000 * 60 * 60 * 24);
    case 'weekly':
      return new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
    case 'monthly':
      return new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
    default:
      return new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7);
  }
};

module.exports = router; 