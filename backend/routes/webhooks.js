const express = require('express');
const crypto = require('crypto');
const { asyncHandler } = require('../middleware/errorHandler');
const Feedback = require('../models/Feedback');
const aiService = require('../services/aiService');

const router = express.Router();

// Verify webhook signature
const verifyWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature'] || req.headers['x-signature'];
  const secret = process.env.WEBHOOK_SECRET || 'default_secret';
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing signature' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

// Intercom webhook
router.post('/intercom/:userId', verifyWebhookSignature, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { data } = req.body;

  try {
    // Process Intercom conversation data
    if (data.item && data.item.type === 'conversation') {
      const conversation = data.item.conversation;
      
      const feedback = await Feedback.create({
        userId,
        source: 'intercom',
        sourceId: conversation.id.toString(),
        customerId: conversation.user?.id?.toString(),
        customerEmail: conversation.user?.email,
        customerName: conversation.user?.name,
        content: conversation.conversation_message?.body || 'No content',
        title: conversation.conversation_message?.subject || 'Intercom Conversation',
        metadata: {
          conversationId: conversation.id,
          conversationType: conversation.conversation_type,
          createdAt: conversation.created_at,
          updatedAt: conversation.updated_at,
          assignee: conversation.assignee,
          tags: conversation.tags
        },
        originalData: req.body
      });

      // Process with AI
      processFeedbackWithAI(feedback.id).catch(console.error);

      console.log(`✅ Intercom webhook processed: ${conversation.id}`);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Intercom webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}));

// Zendesk webhook
router.post('/zendesk/:userId', verifyWebhookSignature, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { ticket } = req.body;

  try {
    if (ticket) {
      const feedback = await Feedback.create({
        userId,
        source: 'zendesk',
        sourceId: ticket.id.toString(),
        customerId: ticket.requester_id?.toString(),
        customerEmail: ticket.requester?.email,
        customerName: ticket.requester?.name,
        content: ticket.description || 'No description',
        title: ticket.subject || 'Zendesk Ticket',
        rating: ticket.satisfaction_rating?.score,
        metadata: {
          ticketId: ticket.id,
          status: ticket.status,
          priority: ticket.priority,
          assigneeId: ticket.assignee_id,
          tags: ticket.tags,
          createdAt: ticket.created_at,
          updatedAt: ticket.updated_at
        },
        originalData: req.body
      });

      // Process with AI
      processFeedbackWithAI(feedback.id).catch(console.error);

      console.log(`✅ Zendesk webhook processed: ${ticket.id}`);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Zendesk webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}));

// Google Play webhook
router.post('/google-play/:userId', verifyWebhookSignature, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { review } = req.body;

  try {
    if (review) {
      const feedback = await Feedback.create({
        userId,
        source: 'google_play',
        sourceId: review.reviewId,
        customerId: review.authorName,
        customerName: review.authorName,
        content: review.comment || 'No comment',
        title: `Google Play Review - ${review.reviewId}`,
        rating: review.starRating,
        metadata: {
          reviewId: review.reviewId,
          appVersion: review.appVersionName,
          device: review.deviceMetadata?.device,
          androidOsVersion: review.deviceMetadata?.androidOsVersion,
          reviewLanguage: review.reviewerLanguage,
          reviewTimestamp: review.reviewTimestamp,
          lastModified: review.lastModified
        },
        originalData: req.body
      });

      // Process with AI
      processFeedbackWithAI(feedback.id).catch(console.error);

      console.log(`✅ Google Play webhook processed: ${review.reviewId}`);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Google Play webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}));

// App Store webhook
router.post('/app-store/:userId', verifyWebhookSignature, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { review } = req.body;

  try {
    if (review) {
      const feedback = await Feedback.create({
        userId,
        source: 'app_store',
        sourceId: review.id,
        customerId: review.reviewerNickname,
        customerName: review.reviewerNickname,
        content: review.review || 'No review',
        title: `App Store Review - ${review.id}`,
        rating: review.rating,
        metadata: {
          reviewId: review.id,
          appVersion: review.version,
          reviewLanguage: review.language,
          reviewTimestamp: review.timestamp,
          title: review.title
        },
        originalData: req.body
      });

      // Process with AI
      processFeedbackWithAI(feedback.id).catch(console.error);

      console.log(`✅ App Store webhook processed: ${review.id}`);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('App Store webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}));

// Twitter webhook
router.post('/twitter/:userId', verifyWebhookSignature, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { tweet } = req.body;

  try {
    if (tweet) {
      const feedback = await Feedback.create({
        userId,
        source: 'twitter',
        sourceId: tweet.id_str,
        customerId: tweet.user?.id_str,
        customerName: tweet.user?.screen_name,
        content: tweet.text || 'No text',
        title: `Twitter Mention - ${tweet.id_str}`,
        metadata: {
          tweetId: tweet.id_str,
          userId: tweet.user?.id_str,
          username: tweet.user?.screen_name,
          createdAt: tweet.created_at,
          retweetCount: tweet.retweet_count,
          favoriteCount: tweet.favorite_count,
          hashtags: tweet.entities?.hashtags,
          mentions: tweet.entities?.user_mentions
        },
        originalData: req.body
      });

      // Process with AI
      processFeedbackWithAI(feedback.id).catch(console.error);

      console.log(`✅ Twitter webhook processed: ${tweet.id_str}`);
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Twitter webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}));

// Generic webhook for custom integrations
router.post('/generic/:userId', verifyWebhookSignature, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { source, data } = req.body;

  try {
    if (!source || !data) {
      return res.status(400).json({ error: 'Missing source or data' });
    }

    const feedback = await Feedback.create({
      userId,
      source: source.toLowerCase(),
      sourceId: data.id?.toString() || Date.now().toString(),
      customerId: data.customerId?.toString(),
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      content: data.content || data.message || data.text || 'No content',
      title: data.title || data.subject || `${source} Feedback`,
      rating: data.rating,
      metadata: {
        originalData: data,
        source: source,
        timestamp: data.timestamp || new Date().toISOString()
      },
      originalData: req.body
    });

    // Process with AI
    processFeedbackWithAI(feedback.id).catch(console.error);

    console.log(`✅ Generic webhook processed: ${source} - ${feedback.id}`);
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Generic webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}));

// Webhook health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'InsightPulse Webhooks'
  });
});

// Webhook test endpoint
router.post('/test/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { source, testData } = req.body;

  try {
    const feedback = await Feedback.create({
      userId,
      source: source || 'test',
      sourceId: `test_${Date.now()}`,
      content: testData?.content || 'Test feedback content',
      title: testData?.title || 'Test Feedback',
      metadata: {
        test: true,
        testData
      },
      originalData: req.body
    });

    // Process with AI
    await processFeedbackWithAI(feedback.id);

    res.json({
      status: 'success',
      message: 'Test webhook processed successfully',
      feedbackId: feedback.id
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: 'Failed to process test webhook' });
  }
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

    console.log(`✅ Webhook feedback ${feedbackId} processed successfully`);
  } catch (error) {
    console.error(`❌ Error processing webhook feedback ${feedbackId}:`, error);
    
    // Update status to failed
    await Feedback.update(
      { processingStatus: 'failed' },
      { where: { id: feedbackId } }
    );
  }
}

module.exports = router; 