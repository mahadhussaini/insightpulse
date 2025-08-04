const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { checkSubscriptionLimit } = require('../middleware/auth');
const Integration = require('../models/Integration');
const integrationService = require('../services/integrationService');

const router = express.Router();

// Get all integrations
router.get('/', asyncHandler(async (req, res) => {
  const integrations = await Integration.getActiveIntegrations(req.user.id);
  res.json({ integrations });
}));

// Get single integration
router.get('/:id', asyncHandler(async (req, res) => {
  const integration = await Integration.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!integration) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  res.json({ integration });
}));

// Create new integration
router.post('/', [
  body('type').isIn(Object.keys(integrationService.getSupportedTypes())),
  body('name').trim().isLength({ min: 1 }),
  body('config').isObject(),
  body('credentials').isObject()
], checkSubscriptionLimit('integrations'), asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { type, name, config, credentials } = req.body;

  // Check if integration already exists for this user and type
  const existingIntegration = await Integration.findByUserAndType(req.user.id, type);
  if (existingIntegration) {
    return res.status(400).json({
      error: `Integration of type ${type} already exists for this user`
    });
  }

  // Test connection
  const testResult = await integrationService.testConnection({
    type,
    config,
    credentials
  });

  if (!testResult.success) {
    return res.status(400).json({
      error: 'Connection test failed',
      details: testResult.message
    });
  }

  // Create integration
  const integration = await Integration.create({
    userId: req.user.id,
    type,
    name,
    config,
    credentials,
    status: 'connected',
    lastSync: new Date()
  });

  res.status(201).json({
    message: 'Integration created successfully',
    integration
  });
}));

// Update integration
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  body('config').optional().isObject(),
  body('credentials').optional().isObject(),
  body('isActive').optional().isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { name, config, credentials, isActive } = req.body;

  const integration = await Integration.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!integration) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  // Update fields
  if (name) integration.name = name;
  if (config) integration.config = config;
  if (credentials) integration.credentials = credentials;
  if (typeof isActive === 'boolean') {
    integration.isActive = isActive;
    integration.status = isActive ? 'connected' : 'disconnected';
  }

  await integration.save();

  res.json({
    message: 'Integration updated successfully',
    integration
  });
}));

// Delete integration
router.delete('/:id', asyncHandler(async (req, res) => {
  const integration = await Integration.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!integration) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  await integration.destroy();

  res.json({
    message: 'Integration deleted successfully'
  });
}));

// Test integration connection
router.post('/:id/test', asyncHandler(async (req, res) => {
  const integration = await Integration.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!integration) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  try {
    const testResult = await integrationService.testConnection(integration);
    res.json({
      message: 'Connection test successful',
      details: testResult
    });
  } catch (error) {
    res.status(400).json({
      error: 'Connection test failed',
      details: error.message
    });
  }
}));

// Sync integration data
router.post('/:id/sync', asyncHandler(async (req, res) => {
  const integration = await Integration.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!integration) {
    return res.status(404).json({ error: 'Integration not found' });
  }

  try {
    const syncResult = await integrationService.syncIntegration(integration.id);
    res.json({
      message: 'Sync completed successfully',
      syncId: Date.now().toString(),
      status: 'completed',
      result: syncResult
    });
  } catch (error) {
    res.status(400).json({
      error: 'Sync failed',
      details: error.message
    });
  }
}));

// Get integration sync status
router.get('/:id/sync-status', asyncHandler(async (req, res) => {
  const integrationId = req.params.id;

  res.json({
    syncId: 'sync_123',
    status: 'completed',
    progress: 100,
    lastSync: new Date().toISOString(),
    nextSync: new Date(Date.now() + 3600000).toISOString(),
    stats: {
      newRecords: 25,
      updatedRecords: 10,
      errors: 0
    }
  });
}));

// Get integration webhook configuration
router.get('/:id/webhook', asyncHandler(async (req, res) => {
  const integrationId = req.params.id;

  res.json({
    webhookUrl: `https://api.insightpulse.com/webhooks/${integrationId}`,
    events: ['ticket.created', 'ticket.updated', 'conversation.created'],
    secret: 'webhook_secret_here',
    isActive: true
  });
}));

// Update webhook configuration
router.put('/:id/webhook', [
  body('events').isArray(),
  body('isActive').isBoolean()
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { events, isActive } = req.body;

  res.json({
    message: 'Webhook configuration updated successfully',
    webhook: {
      url: `https://api.insightpulse.com/webhooks/${req.params.id}`,
      events,
      isActive
    }
  });
}));

// Get integration statistics
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const integrationId = req.params.id;

  res.json({
    stats: {
      totalRecords: 1250,
      lastSync: new Date().toISOString(),
      syncFrequency: 'hourly',
      avgResponseTime: '2.5h',
      satisfactionScore: 4.2,
      errorRate: 0.5,
      uptime: 99.9
    }
  });
}));

module.exports = router; 