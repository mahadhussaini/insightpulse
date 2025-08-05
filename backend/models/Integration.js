const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Integration = sequelize.define('Integration', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'intercom',
      'zendesk',
      'freshdesk',
      'google_play',
      'app_store',
      'trustpilot',
      'g2',
      'twitter',
      'reddit',
      'linkedin',
      'facebook',
      'typeform',
      'google_forms',
      'surveymonkey',
      'gmail',
      'hubspot',
      'salesforce',
      'slack',
      'webhook'
    ),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('connected', 'disconnected', 'error', 'syncing'),
    defaultValue: 'disconnected'
  },
  config: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  credentials: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  lastSync: {
    type: DataTypes.DATE,
    allowNull: true
  },
  syncInterval: {
    type: DataTypes.INTEGER, // minutes
    defaultValue: 60
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  stats: {
    type: DataTypes.JSONB,
    defaultValue: {
      totalItems: 0,
      lastSyncItems: 0,
      avgResponseTime: null,
      satisfactionScore: null
    }
  },
  webhookUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  webhookSecret: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'integrations',
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
      fields: ['status']
    }
  ]
});

// Instance methods
Integration.prototype.updateStats = function(newStats) {
  this.stats = { ...this.stats, ...newStats };
  return this.save();
};

Integration.prototype.markAsConnected = function() {
  this.status = 'connected';
  this.errorMessage = null;
  return this.save();
};

Integration.prototype.markAsError = function(errorMessage) {
  this.status = 'error';
  this.errorMessage = errorMessage;
  return this.save();
};

Integration.prototype.updateLastSync = function() {
  this.lastSync = new Date();
  return this.save();
};

// Class methods
Integration.findByUserAndType = function(userId, type) {
  return this.findOne({
    where: { userId, type, isActive: true }
  });
};

Integration.getActiveIntegrations = function(userId) {
  return this.findAll({
    where: { userId, isActive: true },
    order: [['createdAt', 'DESC']]
  });
};

module.exports = Integration; 