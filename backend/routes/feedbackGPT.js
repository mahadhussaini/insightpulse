const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const feedbackGPTService = require('../services/feedbackGPTService');

const router = express.Router();

// Process a natural language query about feedback
router.post('/query', [
  authenticateToken,
  body('query').trim().isLength({ min: 3, max: 500 }).withMessage('Query must be between 3 and 500 characters'),
  body('timeRange').optional().isIn(['7d', '30d', '90d']).withMessage('Invalid time range'),
  body('source').optional().isString().withMessage('Source must be a string'),
  body('limit').optional().isInt({ min: 10, max: 1000 }).withMessage('Limit must be between 10 and 1000'),
  body('includeRawData').optional().isBoolean().withMessage('includeRawData must be a boolean')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { query, timeRange, source, limit, includeRawData } = req.body;

  const result = await feedbackGPTService.processQuery(req.user.id, query, {
    timeRange,
    source,
    limit,
    includeRawData
  });

  res.json({
    success: true,
    data: result
  });
}));

// Get predefined queries for quick access
router.get('/predefined', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const predefinedQueries = feedbackGPTService.getPredefinedQueries();
  
  res.json({
    success: true,
    data: predefinedQueries
  });
}));

// Get query suggestions based on current feedback data
router.get('/suggestions', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const suggestions = await feedbackGPTService.getQuerySuggestions(req.user.id);
  
  res.json({
    success: true,
    data: suggestions
  });
}));

// Get query history for the user
router.get('/history', [
  authenticateToken,
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

  const { page = 1, limit = 20 } = req.query;
  
  // TODO: Implement query history storage and retrieval
  // For now, return empty history
  res.json({
    success: true,
    data: {
      queries: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      }
    }
  });
}));

// Save a query to favorites
router.post('/favorites', [
  authenticateToken,
  body('query').trim().isLength({ min: 3, max: 500 }).withMessage('Query must be between 3 and 500 characters'),
  body('title').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { query, title } = req.body;
  
  // TODO: Implement favorites storage
  // For now, return success
  res.json({
    success: true,
    message: 'Query saved to favorites',
    data: {
      id: Date.now().toString(),
      query,
      title: title || query.substring(0, 50) + '...',
      createdAt: new Date()
    }
  });
}));

// Get user's favorite queries
router.get('/favorites', [
  authenticateToken
], asyncHandler(async (req, res) => {
  // TODO: Implement favorites retrieval
  // For now, return empty list
  res.json({
    success: true,
    data: []
  });
}));

// Delete a favorite query
router.delete('/favorites/:id', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // TODO: Implement favorite deletion
  // For now, return success
  res.json({
    success: true,
    message: 'Favorite query deleted'
  });
}));

// Get query analytics (usage statistics)
router.get('/analytics', [
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
  
  // TODO: Implement query analytics
  // For now, return mock data
  res.json({
    success: true,
    data: {
      totalQueries: 0,
      popularQueries: [],
      averageResponseTime: 0,
      successRate: 100,
      timeRange
    }
  });
}));

module.exports = router; 