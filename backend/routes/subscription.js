const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const subscriptionService = require('../services/subscriptionService');

const router = express.Router();

// Get user's current subscription
router.get('/current', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserSubscription(req.user.id);

  res.json({
    success: subscription.success,
    data: subscription.data
  });
}));

// Get all available plans
router.get('/plans', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const plans = await subscriptionService.getPlans();

  res.json({
    success: plans.success,
    data: plans.data
  });
}));

// Check feature access
router.get('/feature/:feature', [
  authenticateToken,
  query('feature').isString().withMessage('Feature must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { feature } = req.params;
  const access = await subscriptionService.hasFeatureAccess(req.user.id, feature);

  res.json({
    success: access.success,
    data: {
      hasAccess: access.hasAccess,
      plan: access.plan
    }
  });
}));

// Check usage limits
router.get('/usage/:feature', [
  authenticateToken,
  query('feature').isIn(['feedback', 'ai_queries', 'integrations', 'users']).withMessage('Invalid feature')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { feature } = req.params;
  const usage = await subscriptionService.checkUsageLimits(req.user.id, feature);

  res.json({
    success: usage.success,
    data: {
      withinLimits: usage.withinLimits,
      limitExceeded: usage.limitExceeded,
      currentUsage: usage.currentUsage,
      limits: usage.limits
    }
  });
}));

// Upgrade subscription
router.post('/upgrade', [
  authenticateToken,
  body('plan').isIn(['free', 'starter', 'professional', 'enterprise']).withMessage('Invalid plan'),
  body('billingCycle').optional().isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { plan, billingCycle = 'monthly' } = req.body;
  const result = await subscriptionService.upgradeSubscription(req.user.id, plan, billingCycle);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Cancel subscription
router.post('/cancel', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const result = await subscriptionService.cancelSubscription(req.user.id);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Get billing history
router.get('/billing', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const history = await subscriptionService.getBillingHistory(req.user.id);

  res.json({
    success: history.success,
    data: history.data
  });
}));

// Get feature comparison
router.get('/comparison', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const comparison = await subscriptionService.getFeatureComparison();

  res.json({
    success: comparison.success,
    data: comparison.data
  });
}));

// Get usage analytics
router.get('/analytics', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const analytics = await subscriptionService.getUsageAnalytics(req.user.id);

  res.json({
    success: analytics.success,
    data: analytics.data
  });
}));

// Validate subscription
router.get('/validate', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const validation = await subscriptionService.validateSubscription(req.user.id);

  res.json({
    success: true,
    data: validation
  });
}));

// Get plan recommendations
router.get('/recommendations', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const recommendations = await subscriptionService.getPlanRecommendations(req.user.id);

  res.json({
    success: recommendations.success,
    data: recommendations.data
  });
}));

// Get subscription limits
router.get('/limits', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserSubscription(req.user.id);
  
  if (!subscription.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not get subscription data'
    });
  }

  const plan = subscriptionService.limits[subscription.data.plan];
  const limits = {
    plan: subscription.data.plan,
    planName: plan.name,
    limits: plan.limits,
    features: plan.features
  };

  res.json({
    success: true,
    data: limits
  });
}));

// Get subscription status
router.get('/status', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserSubscription(req.user.id);
  const validation = await subscriptionService.validateSubscription(req.user.id);
  
  if (!subscription.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not get subscription data'
    });
  }

  const status = {
    plan: subscription.data.plan,
    status: subscription.data.status,
    valid: validation.valid,
    reason: validation.reason,
    startDate: subscription.data.startDate,
    endDate: subscription.data.endDate,
    nextBillingDate: subscription.data.nextBillingDate,
    billingCycle: subscription.data.billingCycle
  };

  res.json({
    success: true,
    data: status
  });
}));

// Get subscription features
router.get('/features', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserSubscription(req.user.id);
  
  if (!subscription.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not get subscription data'
    });
  }

  const plan = subscriptionService.limits[subscription.data.plan];
  const features = plan.features.map(feature => ({
    id: feature,
    name: feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    enabled: true
  }));

  // Add disabled features
  const allFeatures = Object.values(subscriptionService.features);
  const disabledFeatures = allFeatures.filter(feature => !plan.features.includes(feature));
  
  disabledFeatures.forEach(feature => {
    features.push({
      id: feature,
      name: feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      enabled: false
    });
  });

  res.json({
    success: true,
    data: {
      plan: subscription.data.plan,
      features
    }
  });
}));

// Get subscription usage
router.get('/usage', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserSubscription(req.user.id);
  const analytics = await subscriptionService.getUsageAnalytics(req.user.id);
  
  if (!subscription.success || !analytics.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not get subscription data'
    });
  }

  const usage = {
    plan: subscription.data.plan,
    currentUsage: subscription.data.usage,
    analytics: analytics.data
  };

  res.json({
    success: true,
    data: usage
  });
}));

// Get subscription summary
router.get('/summary', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const subscription = await subscriptionService.getUserSubscription(req.user.id);
  const validation = await subscriptionService.validateSubscription(req.user.id);
  const analytics = await subscriptionService.getUsageAnalytics(req.user.id);
  const recommendations = await subscriptionService.getPlanRecommendations(req.user.id);
  
  if (!subscription.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not get subscription data'
    });
  }

  const summary = {
    subscription: subscription.data,
    validation,
    analytics: analytics.success ? analytics.data : null,
    recommendations: recommendations.success ? recommendations.data : []
  };

  res.json({
    success: true,
    data: summary
  });
}));

module.exports = router; 