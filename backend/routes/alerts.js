const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Import models
const Alert = require('../models/Alert');
const User = require('../models/User');

// Import middleware
const { authenticateToken } = require('../middleware/auth');

// Get all alerts with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      severity,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const whereClause = { userId: req.user.id };
    const orderClause = [[sortBy, sortOrder.toUpperCase()]];

    // Add filters
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    if (severity && severity !== 'all') {
      whereClause.severity = severity;
    }

    // Add search functionality
    if (search) {
      whereClause[require('sequelize').Op.or] = [
        { title: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { message: { [require('sequelize').Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Alert.findAndCountAll({
      where: whereClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      alerts: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Get alert by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ error: 'Failed to fetch alert' });
  }
});

// Create new alert
router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['sentiment_spike', 'urgent_feedback', 'integration_error', 'sync_failed', 'quota_exceeded', 'system_maintenance', 'custom']).withMessage('Invalid alert type'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      message,
      type,
      severity = 'medium',
      metadata,
      relatedFeedbackIds,
      relatedIntegrationId,
      expiresAt
    } = req.body;

    const alert = await Alert.create({
      userId: req.user.id,
      title,
      message,
      type,
      severity,
      metadata: metadata || {},
      relatedFeedbackIds: relatedFeedbackIds || [],
      relatedIntegrationId,
      expiresAt,
      isRead: false
    });

    res.status(201).json(alert);
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Update alert
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    const allowedFields = [
      'title', 'message', 'type', 'severity', 'metadata', 
      'relatedFeedbackIds', 'relatedIntegrationId', 'expiresAt'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    await alert.update(updateData);

    res.json(alert);
  } catch (error) {
    console.error('Error updating alert:', error);
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete alert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await alert.destroy();

    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Mark alert as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const alert = await Alert.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await alert.markAsRead();

    res.json(alert);
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ error: 'Failed to mark alert as read' });
  }
});

// Get alert statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalAlerts = await Alert.count({ where: { userId: req.user.id } });
    const unreadAlerts = await Alert.count({ 
      where: { 
        userId: req.user.id,
        isRead: false 
      } 
    });
    const criticalAlerts = await Alert.count({ 
      where: { 
        userId: req.user.id,
        severity: 'critical',
        isRead: false
      } 
    });

    const alertsByType = await Alert.findAll({
      attributes: [
        'type',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { userId: req.user.id },
      group: ['type']
    });

    const alertsBySeverity = await Alert.findAll({
      attributes: [
        'severity',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      where: { userId: req.user.id },
      group: ['severity']
    });

    res.json({
      overview: {
        totalAlerts,
        unreadAlerts,
        criticalAlerts
      },
      byType: alertsByType,
      bySeverity: alertsBySeverity
    });
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    res.status(500).json({ error: 'Failed to fetch alert statistics' });
  }
});

// Get recent alerts
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const recentAlerts = await Alert.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    res.json(recentAlerts);
  } catch (error) {
    console.error('Error fetching recent alerts:', error);
    res.status(500).json({ error: 'Failed to fetch recent alerts' });
  }
});

// Bulk update alerts
router.patch('/bulk/update', authenticateToken, async (req, res) => {
  try {
    const { alertIds, updates } = req.body;

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({ error: 'Alert IDs are required' });
    }

    const allowedFields = ['isRead'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    await Alert.update(updateData, {
      where: {
        id: alertIds,
        userId: req.user.id
      }
    });

    res.json({ message: 'Alerts updated successfully' });
  } catch (error) {
    console.error('Error bulk updating alerts:', error);
    res.status(500).json({ error: 'Failed to update alerts' });
  }
});

module.exports = router; 