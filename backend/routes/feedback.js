const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkSubscriptionLimit } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const aiService = require('../services/aiService');
const { redisClient } = require('../config/database');

const router = express.Router();

// Get all feedback with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sentiment').optional().isIn(['positive', 'negative', 'neutral', 'mixed']),
  query('urgency').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('source').optional().isIn(['intercom', 'zendesk', 'google_play', 'app_store', 'twitter', 'email', 'nps_survey', 'manual', 'webhook', 'api']),
  query('isResolved').optional().isBoolean(),
  query('isProcessed').optional().isBoolean(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('search').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const {
    page = 1,
    limit = 20,
    sentiment,
    urgency,
    source,
    isResolved,
    isProcessed,
    dateFrom,
    dateTo,
    search
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { userId: req.user.id };

  // Add filters
  if (sentiment) whereClause.sentiment = sentiment;
  if (urgency) whereClause.urgency = urgency;
  if (source) whereClause.source = source;
  if (isResolved !== undefined) whereClause.isResolved = isResolved;
  if (isProcessed !== undefined) whereClause.isProcessed = isProcessed;

  // Date range filter
  if (dateFrom || dateTo) {
    whereClause.createdAt = {};
    if (dateFrom) whereClause.createdAt[require('sequelize').Op.gte] = new Date(dateFrom);
    if (dateTo) whereClause.createdAt[require('sequelize').Op.lte] = new Date(dateTo);
  }

  // Search filter
  if (search) {
    whereClause[require('sequelize').Op.or] = [
      { content: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { title: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { customerName: { [require('sequelize').Op.iLike]: `%${search}%` } },
      { customerEmail: { [require('sequelize').Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Feedback.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  res.json({
    feedback: rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// Get single feedback by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id
    }
  });

  if (!feedback) {
    return res.status(404).json({
      error: 'Feedback not found',
      code: 'FEEDBACK_NOT_FOUND'
    });
  }

  res.json({ feedback });
}));

// Create new feedback
router.post('/', [
  body('content').trim().isLength({ min: 1 }),
  body('source').isIn(['intercom', 'zendesk', 'google_play', 'app_store', 'twitter', 'email', 'nps_survey', 'manual', 'webhook', 'api']),
  body('title').optional().trim(),
  body('customerName').optional().trim(),
  body('customerEmail').optional().isEmail(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('sourceId').optional().trim(),
  body('customerId').optional().trim(),
  body('metadata').optional().isObject()
], checkSubscriptionLimit('feedback'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const {
    content,
    source,
    title,
    customerName,
    customerEmail,
    rating,
    sourceId,
    customerId,
    metadata
  } = req.body;

  // Check for duplicate if sourceId is provided
  if (sourceId) {
    const existing = await Feedback.findOne({
      where: {
        userId: req.user.id,
        source,
        sourceId
      }
    });

    if (existing) {
      return res.status(409).json({
        error: 'Feedback already exists',
        code: 'DUPLICATE_FEEDBACK'
      });
    }
  }

  // Detect language
  const language = await aiService.detectLanguage(content);

  // Create feedback record
  const feedback = await Feedback.create({
    userId: req.user.id,
    content,
    source,
    title,
    customerName,
    customerEmail,
    rating,
    sourceId,
    customerId,
    language,
    metadata,
    originalData: req.body
  });

  // Process with AI asynchronously
  processFeedbackWithAI(feedback.id).catch(console.error);

  res.status(201).json({
    message: 'Feedback created successfully',
    feedback: {
      id: feedback.id,
      content: feedback.content,
      source: feedback.source,
      processingStatus: feedback.processingStatus
    }
  });
}));

// Update feedback
router.put('/:id', [
  body('content').optional().trim().isLength({ min: 1 }),
  body('title').optional().trim(),
  body('customerName').optional().trim(),
  body('customerEmail').optional().isEmail(),
  body('rating').optional().isInt({ min: 1, max: 5 }),
  body('tags').optional().isArray(),
  body('isResolved').optional().isBoolean(),
  body('resolutionNotes').optional().trim()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const feedback = await Feedback.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id
    }
  });

  if (!feedback) {
    return res.status(404).json({
      error: 'Feedback not found',
      code: 'FEEDBACK_NOT_FOUND'
    });
  }

  const updateData = {};
  const { content, title, customerName, customerEmail, rating, tags, isResolved, resolutionNotes } = req.body;

  if (content !== undefined) updateData.content = content;
  if (title !== undefined) updateData.title = title;
  if (customerName !== undefined) updateData.customerName = customerName;
  if (customerEmail !== undefined) updateData.customerEmail = customerEmail;
  if (rating !== undefined) updateData.rating = rating;
  if (tags !== undefined) updateData.tags = tags;
  if (isResolved !== undefined) {
    updateData.isResolved = isResolved;
    if (isResolved) {
      updateData.resolvedBy = req.user.id;
      updateData.resolvedAt = new Date();
    } else {
      updateData.resolvedBy = null;
      updateData.resolvedAt = null;
    }
  }
  if (resolutionNotes !== undefined) updateData.resolutionNotes = resolutionNotes;

  await feedback.update(updateData);

  // Reprocess with AI if content changed
  if (content && content !== feedback.content) {
    processFeedbackWithAI(feedback.id).catch(console.error);
  }

  res.json({
    message: 'Feedback updated successfully',
    feedback
  });
}));

// Delete feedback
router.delete('/:id', asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id
    }
  });

  if (!feedback) {
    return res.status(404).json({
      error: 'Feedback not found',
      code: 'FEEDBACK_NOT_FOUND'
    });
  }

  await feedback.destroy();

  res.json({
    message: 'Feedback deleted successfully'
  });
}));

// Flag feedback
router.post('/:id/flag', [
  body('reason').trim().isLength({ min: 1 })
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const feedback = await Feedback.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id
    }
  });

  if (!feedback) {
    return res.status(404).json({
      error: 'Feedback not found',
      code: 'FEEDBACK_NOT_FOUND'
    });
  }

  await feedback.update({
    isFlagged: true,
    flaggedBy: req.user.id,
    flaggedReason: req.body.reason
  });

  res.json({
    message: 'Feedback flagged successfully',
    feedback
  });
}));

// Unflag feedback
router.post('/:id/unflag', asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id
    }
  });

  if (!feedback) {
    return res.status(404).json({
      error: 'Feedback not found',
      code: 'FEEDBACK_NOT_FOUND'
    });
  }

  await feedback.update({
    isFlagged: false,
    flaggedBy: null,
    flaggedReason: null
  });

  res.json({
    message: 'Feedback unflagged successfully',
    feedback
  });
}));

// Get AI insights for feedback
router.get('/:id/insights', asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id
    }
  });

  if (!feedback) {
    return res.status(404).json({
      error: 'Feedback not found',
      code: 'FEEDBACK_NOT_FOUND'
    });
  }

  // Get response suggestions
  const responseSuggestions = await aiService.generateResponseSuggestions(feedback, {
    companyTone: 'professional and helpful',
    responseStyle: 'empathetic and solution-oriented'
  });

  res.json({
    insights: {
      sentiment: feedback.sentiment,
      sentimentScore: feedback.sentimentScore,
      emotions: feedback.emotions,
      urgency: feedback.urgency,
      categories: feedback.categories,
      aiInsights: feedback.aiInsights,
      responseSuggestions
    }
  });
}));

// Reprocess feedback with AI
router.post('/:id/reprocess', asyncHandler(async (req, res) => {
  const feedback = await Feedback.findOne({
    where: {
      id: req.params.id,
      userId: req.user.id
    }
  });

  if (!feedback) {
    return res.status(404).json({
      error: 'Feedback not found',
      code: 'FEEDBACK_NOT_FOUND'
    });
  }

  // Update processing status
  await feedback.update({
    processingStatus: 'processing',
    isProcessed: false
  });

  // Process with AI
  await processFeedbackWithAI(feedback.id);

  res.json({
    message: 'Feedback reprocessing started',
    feedback: {
      id: feedback.id,
      processingStatus: 'processing'
    }
  });
}));

// Async function to process feedback with AI
async function processFeedbackWithAI(feedbackId) {
  try {
    const feedback = await Feedback.findByPk(feedbackId);
    if (!feedback) return;

    // Update status to processing
    await feedback.update({ processingStatus: 'processing' });

    // Analyze sentiment and emotions
    const sentimentAnalysis = await aiService.analyzeSentiment(feedback.content, feedback.language);

    // Categorize feedback
    const categorization = await aiService.categorizeFeedback(feedback.content);

    // Update feedback with AI results
    await feedback.update({
      sentiment: sentimentAnalysis.sentiment,
      sentimentScore: sentimentAnalysis.sentimentScore,
      emotions: sentimentAnalysis.emotions,
      urgency: sentimentAnalysis.urgency,
      categories: categorization.primaryCategory,
      tags: categorization.tags,
      aiInsights: {
        suggestedActions: sentimentAnalysis.suggestedActions,
        topics: sentimentAnalysis.topics,
        categorization: categorization
      },
      isProcessed: true,
      processingStatus: 'completed'
    });

    console.log(`✅ Feedback ${feedbackId} processed successfully`);
  } catch (error) {
    console.error(`❌ Error processing feedback ${feedbackId}:`, error);
    
    // Update status to failed
    await Feedback.update(
      { processingStatus: 'failed' },
      { where: { id: feedbackId } }
    );
  }
}

module.exports = router; 