const { sequelize } = require('./config/database');
const bcrypt = require('bcryptjs');

// Import models
const User = require('./models/User');
const Feedback = require('./models/Feedback');
const Integration = require('./models/Integration');
const Alert = require('./models/Alert');
const Task = require('./models/Task');

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models
    console.log('📦 Syncing database models...');
    await sequelize.sync({ force: true }); // Use force: true to recreate tables
    console.log('✅ Database models synchronized.');

    // Create default admin user
    console.log('👤 Creating default admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await User.create({
      email: 'admin@insightpulse.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      subscription: 'enterprise',
      subscriptionStatus: 'active',
      monthlyFeedbackLimit: 10000,
      integrationsLimit: 50,
      isEmailVerified: true,
      preferences: {
        dashboard: {
          defaultView: 'overview',
          refreshInterval: 300,
          widgets: [
            { id: 'sentiment-overview', type: 'chart', title: 'Sentiment Overview', enabled: true },
            { id: 'recent-feedback', type: 'list', title: 'Recent Feedback', enabled: true },
            { id: 'source-distribution', type: 'chart', title: 'Source Distribution', enabled: true },
            { id: 'urgency-alerts', type: 'alerts', title: 'Urgency Alerts', enabled: true },
            { id: 'ai-insights', type: 'insights', title: 'AI Insights', enabled: true }
          ],
          theme: 'light'
        },
        notifications: {
          email: true,
          slack: false,
          browser: true
        }
      }
    });
    console.log('✅ Default admin user created.');

    // Create sample integrations
    console.log('🔗 Creating sample integrations...');
    const integrations = [
      {
        userId: adminUser.id,
        name: 'Intercom',
        type: 'intercom',
        status: 'connected',
        config: {
          accessToken: 'sample_token',
          workspaceId: 'sample_workspace'
        },
        lastSync: new Date(),
        syncFrequency: 300 // 5 minutes
      },
      {
        userId: adminUser.id,
        name: 'Zendesk',
        type: 'zendesk',
        status: 'connected',
        config: {
          subdomain: 'sample',
          email: 'admin@example.com',
          apiToken: 'sample_token'
        },
        lastSync: new Date(),
        syncFrequency: 600 // 10 minutes
      },
      {
        userId: adminUser.id,
        name: 'Twitter',
        type: 'twitter',
        status: 'connected',
        config: {
          apiKey: 'sample_key',
          apiSecret: 'sample_secret',
          accessToken: 'sample_token',
          accessTokenSecret: 'sample_secret'
        },
        lastSync: new Date(),
        syncFrequency: 1800 // 30 minutes
      }
    ];

    for (const integration of integrations) {
      await Integration.create(integration);
    }
    console.log('✅ Sample integrations created.');

    // Create sample feedback
    console.log('📝 Creating sample feedback...');
    const sampleFeedback = [
      {
        userId: adminUser.id,
        content: 'The new dashboard is amazing! Really helps me understand customer sentiment better.',
        source: 'intercom',
        sentiment: 'positive',
        sentimentScore: 0.8,
        urgency: 'low',
        categories: 'feature_request',
        tags: ['dashboard', 'positive', 'feature'],
        customerName: 'Sarah Johnson',
        customerEmail: 'sarah@example.com',
        rating: 5,
        isResolved: true,
        isFlagged: false
      },
      {
        userId: adminUser.id,
        content: 'Having issues with the mobile app crashing when I try to upload images.',
        source: 'zendesk',
        sentiment: 'negative',
        sentimentScore: -0.6,
        urgency: 'high',
        categories: 'bug_report',
        tags: ['mobile', 'crash', 'bug', 'urgent'],
        customerName: 'Mike Chen',
        customerEmail: 'mike@example.com',
        rating: 2,
        isResolved: false,
        isFlagged: true
      },
      {
        userId: adminUser.id,
        content: 'Love the new AI insights feature! It\'s exactly what we needed.',
        source: 'intercom',
        sentiment: 'positive',
        sentimentScore: 0.9,
        urgency: 'low',
        categories: 'praise',
        tags: ['ai', 'insights', 'positive'],
        customerName: 'Emily Davis',
        customerEmail: 'emily@example.com',
        rating: 5,
        isResolved: true,
        isFlagged: false
      },
      {
        userId: adminUser.id,
        content: 'The pricing seems a bit high for small teams like ours.',
        source: 'twitter',
        sentiment: 'neutral',
        sentimentScore: 0.1,
        urgency: 'medium',
        categories: 'pricing',
        tags: ['pricing', 'feedback'],
        customerName: 'Alex Rodriguez',
        customerEmail: 'alex@example.com',
        rating: 3,
        isResolved: false,
        isFlagged: false
      },
      {
        userId: adminUser.id,
        content: 'Critical bug: Users can\'t save their work. This is blocking our entire team.',
        source: 'zendesk',
        sentiment: 'negative',
        sentimentScore: -0.9,
        urgency: 'critical',
        categories: 'bug_report',
        tags: ['critical', 'bug', 'blocking'],
        customerName: 'David Wilson',
        customerEmail: 'david@example.com',
        rating: 1,
        isResolved: false,
        isFlagged: true
      },
      {
        userId: adminUser.id,
        content: 'Great customer support! The team was very helpful and resolved my issue quickly.',
        source: 'intercom',
        sentiment: 'positive',
        sentimentScore: 0.7,
        urgency: 'low',
        categories: 'praise',
        tags: ['support', 'positive'],
        customerName: 'Lisa Thompson',
        customerEmail: 'lisa@example.com',
        rating: 5,
        isResolved: true,
        isFlagged: false
      },
      {
        userId: adminUser.id,
        content: 'Would be great to have more integration options with other tools we use.',
        source: 'twitter',
        sentiment: 'neutral',
        sentimentScore: 0.2,
        urgency: 'low',
        categories: 'feature_request',
        tags: ['integrations', 'feature'],
        customerName: 'Tom Anderson',
        customerEmail: 'tom@example.com',
        rating: 4,
        isResolved: false,
        isFlagged: false
      },
      {
        userId: adminUser.id,
        content: 'The app is too slow and keeps freezing. Need this fixed ASAP.',
        source: 'zendesk',
        sentiment: 'negative',
        sentimentScore: -0.8,
        urgency: 'high',
        categories: 'performance',
        tags: ['performance', 'slow', 'urgent'],
        customerName: 'Rachel Green',
        customerEmail: 'rachel@example.com',
        rating: 2,
        isResolved: false,
        isFlagged: true
      }
    ];

    for (const feedback of sampleFeedback) {
      await Feedback.create(feedback);
    }
    console.log('✅ Sample feedback created.');

    // Create sample alerts
    console.log('🚨 Creating sample alerts...');
    const sampleAlerts = [
      {
        userId: adminUser.id,
        type: 'sentiment_spike',
        title: 'Negative Sentiment Spike',
        message: '5 negative feedback items in the last hour',
        severity: 'medium',
        isRead: false,
        metadata: {
          count: 5,
          timeWindow: '1h',
          sources: ['zendesk', 'intercom']
        }
      },
      {
        userId: adminUser.id,
        type: 'urgent_feedback',
        title: 'Critical Bug Reported',
        message: 'User reported critical bug blocking their work',
        severity: 'critical',
        isRead: false,
        metadata: {
          feedbackId: sampleFeedback[4].id,
          urgency: 'critical'
        }
      }
    ];

    for (const alert of sampleAlerts) {
      await Alert.create(alert);
    }
    console.log('✅ Sample alerts created.');

    // Create sample tasks
    console.log('📋 Creating sample tasks...');
    const sampleTasks = [
      {
        userId: adminUser.id,
        title: 'Investigate mobile app crash',
        description: 'Look into the mobile app crash issue reported by users',
        status: 'in_progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        assignedTo: adminUser.id,
        tags: ['mobile', 'bug', 'urgent']
      },
      {
        userId: adminUser.id,
        title: 'Review pricing feedback',
        description: 'Analyze customer feedback about pricing and propose improvements',
        status: 'todo',
        priority: 'medium',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        assignedTo: adminUser.id,
        tags: ['pricing', 'feedback']
      }
    ];

    for (const task of sampleTasks) {
      await Task.create(task);
    }
    console.log('✅ Sample tasks created.');

    console.log('\n🎉 Database initialization completed successfully!');
    console.log('\n📋 Default credentials:');
    console.log('   Email: admin@insightpulse.com');
    console.log('   Password: admin123');
    console.log('\n🔗 Access your dashboard at: http://localhost:3000');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 