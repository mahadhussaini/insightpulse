const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Task = sequelize.define('Task', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  feedbackId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'feedbacks',
      key: 'id'
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'For integration with external tools like Jira, Trello'
  },
  externalUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'tasks',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['assigned_to']
    },
    {
      fields: ['feedback_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['due_date']
    }
  ]
});

// Instance methods
Task.prototype.markAsCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

Task.prototype.updateStatus = function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'completed') {
    this.completedAt = new Date();
  }
  return this.save();
};

Task.prototype.isOverdue = function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
};

// Class methods
Task.getTasksByUser = function(userId) {
  return this.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
};

Task.getAssignedTasks = function(userId) {
  return this.findAll({
    where: { assignedTo: userId },
    order: [['priority', 'DESC'], ['dueDate', 'ASC']]
  });
};

Task.getTasksByStatus = function(userId, status) {
  return this.findAll({
    where: { userId, status },
    order: [['createdAt', 'DESC']]
  });
};

Task.getOverdueTasks = function(userId) {
  return this.findAll({
    where: {
      userId,
      status: {
        [sequelize.Op.in]: ['pending', 'in_progress']
      },
      dueDate: {
        [sequelize.Op.lt]: new Date()
      }
    },
    order: [['dueDate', 'ASC']]
  });
};

module.exports = Task; 