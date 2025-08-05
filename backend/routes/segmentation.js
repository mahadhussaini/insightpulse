const express = require('express');
const { query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const segmentationService = require('../services/segmentationService');

const router = express.Router();

// Get all available segment types
router.get('/types', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const segmentTypes = segmentationService.getSegmentTypes();
  const typesWithMetadata = segmentTypes.map(type => ({
    id: type,
    ...segmentationService.getSegmentTypeMetadata(type)
  }));
  
  res.json({
    success: true,
    data: typesWithMetadata
  });
}));

// Get segment type metadata
router.get('/types/:type', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { type } = req.params;
  const metadata = segmentationService.getSegmentTypeMetadata(type);
  
  if (!metadata) {
    return res.status(404).json({
      error: 'Segment type not found',
      code: 'SEGMENT_TYPE_NOT_FOUND'
    });
  }
  
  res.json({
    success: true,
    data: {
      id: type,
      ...metadata
    }
  });
}));

// Segment feedback by type
router.get('/:type', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid time range'),
  query('source').optional().isString().withMessage('Source must be a string'),
  query('limit').optional().isInt({ min: 10, max: 10000 }).withMessage('Limit must be between 10 and 10000'),
  query('includeMetadata').optional().isBoolean().withMessage('includeMetadata must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { type } = req.params;
  const { timeRange, source, limit, includeMetadata } = req.query;

  const result = await segmentationService.segmentFeedback(req.user.id, type, {
    timeRange,
    source,
    limit,
    includeMetadata
  });

  res.json({
    success: true,
    data: result
  });
}));

// Get segment details with feedback
router.get('/:type/:segmentId', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid time range'),
  query('source').optional().isString().withMessage('Source must be a string'),
  query('includeFeedback').optional().isBoolean().withMessage('includeFeedback must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { type, segmentId } = req.params;
  const { timeRange, source, includeFeedback } = req.query;

  const result = await segmentationService.segmentFeedback(req.user.id, type, {
    timeRange,
    source,
    limit: 10000,
    includeMetadata: true
  });

  const segment = result.segments.find(s => s.id === segmentId);
  
  if (!segment) {
    return res.status(404).json({
      error: 'Segment not found',
      code: 'SEGMENT_NOT_FOUND'
    });
  }

  // Remove feedback data if not requested
  if (includeFeedback !== 'true') {
    delete segment.feedback;
  }

  res.json({
    success: true,
    data: {
      segmentType: type,
      segment,
      metadata: result.metadata
    }
  });
}));

// Get segment analytics
router.get('/:type/analytics', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid time range'),
  query('source').optional().isString().withMessage('Source must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { type } = req.params;
  const { timeRange, source } = req.query;

  const result = await segmentationService.segmentFeedback(req.user.id, type, {
    timeRange,
    source,
    limit: 10000,
    includeMetadata: true
  });

  // Calculate analytics across all segments
  const analytics = {
    totalSegments: result.segments.length,
    totalFeedback: result.metadata.totalFeedback,
    averageSegmentSize: result.metadata.totalFeedback / result.segments.length,
    segmentDistribution: result.segments.map(segment => ({
      id: segment.id,
      name: segment.name,
      count: segment.stats.count,
      percentage: segment.stats.percentage,
      avgSentiment: segment.stats.avgSentiment
    })),
    topSegments: result.segments
      .sort((a, b) => b.stats.count - a.stats.count)
      .slice(0, 5)
      .map(segment => ({
        id: segment.id,
        name: segment.name,
        count: segment.stats.count,
        percentage: segment.stats.percentage
      })),
    sentimentDistribution: {
      positive: result.segments.filter(s => s.stats.avgSentiment > 0.3).length,
      neutral: result.segments.filter(s => s.stats.avgSentiment >= -0.3 && s.stats.avgSentiment <= 0.3).length,
      negative: result.segments.filter(s => s.stats.avgSentiment < -0.3).length
    }
  };

  res.json({
    success: true,
    data: {
      segmentType: type,
      analytics,
      metadata: result.metadata
    }
  });
}));

// Compare segments
router.post('/compare', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid time range'),
  query('source').optional().isString().withMessage('Source must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { segmentType, segmentIds } = req.body;
  const { timeRange, source } = req.query;

  if (!segmentType || !segmentIds || !Array.isArray(segmentIds)) {
    return res.status(400).json({
      error: 'segmentType and segmentIds array are required',
      code: 'INVALID_REQUEST'
    });
  }

  const result = await segmentationService.segmentFeedback(req.user.id, segmentType, {
    timeRange,
    source,
    limit: 10000,
    includeMetadata: true
  });

  const selectedSegments = result.segments.filter(segment => 
    segmentIds.includes(segment.id)
  );

  if (selectedSegments.length === 0) {
    return res.status(404).json({
      error: 'No matching segments found',
      code: 'NO_SEGMENTS_FOUND'
    });
  }

  const comparison = {
    segmentType,
    segments: selectedSegments,
    comparison: {
      totalFeedback: selectedSegments.reduce((sum, s) => sum + s.stats.count, 0),
      averageSentiment: selectedSegments.reduce((sum, s) => sum + s.stats.avgSentiment, 0) / selectedSegments.length,
      topCategories: this.getTopCategoriesAcrossSegments(selectedSegments),
      topSources: this.getTopSourcesAcrossSegments(selectedSegments)
    },
    metadata: result.metadata
  };

  res.json({
    success: true,
    data: comparison
  });
}));

// Get segment insights (AI-powered analysis)
router.get('/:type/insights', [
  authenticateToken,
  query('timeRange').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid time range'),
  query('source').optional().isString().withMessage('Source must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { type } = req.params;
  const { timeRange, source } = req.query;

  const result = await segmentationService.segmentFeedback(req.user.id, type, {
    timeRange,
    source,
    limit: 10000,
    includeMetadata: true
  });

  // Generate insights based on segment data
  const insights = this.generateSegmentInsights(result.segments, type);

  res.json({
    success: true,
    data: {
      segmentType: type,
      insights,
      metadata: result.metadata
    }
  });
}));

// Helper methods
function getTopCategoriesAcrossSegments(segments) {
  const allCategories = segments.flatMap(segment => 
    segment.stats.topCategories.map(cat => ({ category: cat.category, count: cat.count, segment: segment.name }))
  );
  
  const categoryTotals = {};
  allCategories.forEach(({ category, count }) => {
    categoryTotals[category] = (categoryTotals[category] || 0) + count;
  });
  
  return Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([category, count]) => ({ category, count }));
}

function getTopSourcesAcrossSegments(segments) {
  const allSources = segments.flatMap(segment => 
    segment.stats.topSources.map(src => ({ source: src.source, count: src.count, segment: segment.name }))
  );
  
  const sourceTotals = {};
  allSources.forEach(({ source, count }) => {
    sourceTotals[source] = (sourceTotals[source] || 0) + count;
  });
  
  return Object.entries(sourceTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
}

function generateSegmentInsights(segments, segmentType) {
  const insights = [];
  
  // Find largest segment
  const largestSegment = segments.reduce((max, segment) => 
    segment.stats.count > max.stats.count ? segment : max
  );
  
  insights.push({
    type: 'largest_segment',
    title: `Largest ${segmentType} segment`,
    description: `${largestSegment.name} represents ${largestSegment.stats.percentage.toFixed(1)}% of all feedback`,
    value: largestSegment.name,
    percentage: largestSegment.stats.percentage
  });
  
  // Find most positive segment
  const mostPositive = segments.reduce((max, segment) => 
    segment.stats.avgSentiment > max.stats.avgSentiment ? segment : max
  );
  
  if (mostPositive.stats.avgSentiment > 0.3) {
    insights.push({
      type: 'most_positive',
      title: 'Most satisfied segment',
      description: `${mostPositive.name} has the highest satisfaction score`,
      value: mostPositive.name,
      sentiment: mostPositive.stats.avgSentiment
    });
  }
  
  // Find most negative segment
  const mostNegative = segments.reduce((min, segment) => 
    segment.stats.avgSentiment < min.stats.avgSentiment ? segment : min
  );
  
  if (mostNegative.stats.avgSentiment < -0.3) {
    insights.push({
      type: 'most_negative',
      title: 'Segment needing attention',
      description: `${mostNegative.name} has the lowest satisfaction score`,
      value: mostNegative.name,
      sentiment: mostNegative.stats.avgSentiment
    });
  }
  
  // Find segments with high urgency
  const highUrgencySegments = segments.filter(segment => {
    const urgencyCount = segment.stats.urgencyDistribution.high + segment.stats.urgencyDistribution.critical;
    return urgencyCount > 0;
  });
  
  if (highUrgencySegments.length > 0) {
    insights.push({
      type: 'high_urgency',
      title: 'Segments with urgent issues',
      description: `${highUrgencySegments.length} segments have high or critical urgency feedback`,
      value: highUrgencySegments.map(s => s.name).join(', '),
      count: highUrgencySegments.length
    });
  }
  
  return insights;
}

module.exports = router; 