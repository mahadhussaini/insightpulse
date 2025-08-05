const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define('Feedback', {
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
  source: {
    type: DataTypes.ENUM(
      'intercom',
      'zendesk',
      'google_play',
      'app_store',
      'twitter',
      'email',
      'nps_survey',
      'manual',
      'webhook',
      'api'
    ),
    allowNull: false
  },
  sourceId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'External ID from the source platform'
  },
  customerId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Customer identifier from source platform'
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  sentiment: {
    type: DataTypes.ENUM('positive', 'negative', 'neutral', 'mixed'),
    allowNull: true
  },
  sentimentScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: -1,
      max: 1
    }
  },
  emotions: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Detected emotions with confidence scores'
  },
  urgency: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: true
  },
  categories: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Auto-detected categories and tags'
  },
  tags: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  language: {
    type: DataTypes.STRING(10),
    defaultValue: 'en'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true
  },
  device: {
    type: DataTypes.STRING,
    allowNull: true
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Additional metadata from source'
  },
  isProcessed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  processingStatus: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  aiInsights: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'AI-generated insights and suggestions'
  },
  isResolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolutionNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isFlagged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  flaggedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  flaggedReason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  originalData: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Original data from source platform'
  }
}, {
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['user_id', 'created_at']
    },
    {
      fields: ['source', 'source_id'],
      unique: true
    },
    {
      fields: ['sentiment']
    },
    {
      fields: ['urgency']
    },
    {
      fields: ['is_processed']
    },
    {
      fields: ['is_resolved']
    }
  ]
});

// Instance method to get sentiment label
Feedback.prototype.getSentimentLabel = function() {
  if (this.sentimentScore >= 0.3) return 'positive';
  if (this.sentimentScore <= -0.3) return 'negative';
  return 'neutral';
};

// Instance method to get urgency level
Feedback.prototype.getUrgencyLevel = function() {
  if (this.sentiment === 'negative' && this.sentimentScore < -0.5) return 'high';
  if (this.rating && this.rating <= 2) return 'high';
  return 'medium';
};

// Instance method to check if feedback needs attention
Feedback.prototype.needsAttention = function() {
  return (
    this.sentiment === 'negative' ||
    this.urgency === 'high' ||
    this.urgency === 'critical' ||
    (this.rating && this.rating <= 2)
  );
};

module.exports = Feedback; 