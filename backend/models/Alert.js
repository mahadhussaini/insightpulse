const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'sentiment_spike',
      'urgent_feedback',
      'integration_error',
      'sync_failed',
      'quota_exceeded',
      'system_maintenance',
      'custom'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional alert data'
  },
  relatedFeedbackIds: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  relatedIntegrationId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'integrations',
      key: 'id'
    }
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['is_read']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['created_at']
    }
  ]
});

// Instance methods
Alert.prototype.markAsRead = function() {
  this.isRead = true;
  return this.save();
};

Alert.prototype.isExpired = function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

// Class methods
Alert.getUnreadAlerts = function(userId) {
  return this.findAll({
    where: { 
      userId, 
      isRead: false,
      expiresAt: {
        [sequelize.Op.or]: [
          null,
          { [sequelize.Op.gt]: new Date() }
        ]
      }
    },
    order: [['createdAt', 'DESC']]
  });
};

Alert.getAlertsByType = function(userId, type) {
  return this.findAll({
    where: { userId, type },
    order: [['createdAt', 'DESC']]
  });
};

Alert.createSentimentSpikeAlert = function(userId, data) {
  return this.create({
    userId,
    type: 'sentiment_spike',
    title: 'Negative Sentiment Spike Detected',
    message: `A significant increase in negative sentiment has been detected. ${data.percentage}% increase in negative feedback.`,
    severity: data.percentage > 50 ? 'high' : 'medium',
    metadata: {
      percentage: data.percentage,
      timeRange: data.timeRange,
      source: data.source
    },
    relatedFeedbackIds: data.feedbackIds || []
  });
};

Alert.createUrgentFeedbackAlert = function(userId, feedbackId, urgency) {
  return this.create({
    userId,
    type: 'urgent_feedback',
    title: 'Urgent Feedback Requires Attention',
    message: `New urgent feedback has been received that requires immediate attention.`,
    severity: urgency === 'critical' ? 'critical' : 'high',
    metadata: { urgency },
    relatedFeedbackIds: [feedbackId]
  });
};

module.exports = Alert; 