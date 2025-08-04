const { sequelize } = require('./config/database');

// Import all models
const User = require('./models/User');
const Feedback = require('./models/Feedback');
const Integration = require('./models/Integration');
const Alert = require('./models/Alert');
const Task = require('./models/Task');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync models in dependency order to avoid foreign key issues
    console.log('📦 Syncing User model...');
    await User.sync({ force: false, alter: true });
    
    console.log('📦 Syncing Feedback model...');
    await Feedback.sync({ force: false, alter: true });
    
    console.log('📦 Syncing Integration model...');
    await Integration.sync({ force: false, alter: true });
    
    console.log('📦 Syncing Alert model...');
    await Alert.sync({ force: false, alter: true });
    
    console.log('📦 Syncing Task model...');
    await Task.sync({ force: false, alter: true });
    
    console.log('✅ Database tables synchronized successfully.');
    
    // Create default admin user if it doesn't exist
    let adminUser = await User.findOne({ where: { email: 'admin@insightpulse.com' } });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'admin@insightpulse.com',
        password: 'admin123', // This will be hashed by the model hook
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isEmailVerified: true,
        subscription: {
          plan: 'pro',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          features: {
            monthlyFeedback: 10000,
            integrations: 10,
            teamMembers: 5,
            apiAccess: true,
            prioritySupport: true
          }
        }
      });
      console.log('✅ Default admin user created.');
    }
    
    // Create sample feedback data
    console.log('📦 Creating sample feedback data...');
    const sampleFeedback = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        userId: adminUser.id,
        source: 'intercom',
        sourceId: 'msg_001',
        customerId: 'cust_001',
        customerEmail: 'john@example.com',
        customerName: 'John Doe',
        content: 'The new feature is amazing! Really improved my workflow.',
        title: 'Great new feature',
        rating: 5,
        sentiment: 'positive',
        sentimentScore: 0.9,
        emotions: { joy: 0.8, satisfaction: 0.7 },
        urgency: 'low',
        categories: ['feature-request', 'positive'],
        tags: ['new-feature', 'workflow'],
        language: 'en',
        location: 'US',
        device: 'desktop',
        platform: 'web',
        metadata: { browser: 'Chrome', os: 'Windows' },
        isProcessed: true,
        processingStatus: 'completed',
        aiInsights: { summary: 'Positive feedback about new feature', actionItems: [] },
        isResolved: false,
        originalData: {}
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        userId: adminUser.id,
        source: 'zendesk',
        sourceId: 'ticket_002',
        customerId: 'cust_002',
        customerEmail: 'sarah@example.com',
        customerName: 'Sarah Smith',
        content: 'Having trouble with the login system. Getting error messages.',
        title: 'Login issues',
        rating: 2,
        sentiment: 'negative',
        sentimentScore: -0.6,
        emotions: { frustration: 0.7, anger: 0.3 },
        urgency: 'high',
        categories: ['bug-report', 'login'],
        tags: ['login', 'error', 'urgent'],
        language: 'en',
        location: 'CA',
        device: 'mobile',
        platform: 'ios',
        metadata: { browser: 'Safari', os: 'iOS' },
        isProcessed: true,
        processingStatus: 'completed',
        aiInsights: { summary: 'Login system issues causing user frustration', actionItems: ['Investigate login errors', 'Check mobile compatibility'] },
        isResolved: false,
        originalData: {}
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        userId: adminUser.id,
        source: 'app-store',
        sourceId: 'review_003',
        customerId: 'cust_003',
        customerEmail: 'mike@example.com',
        customerName: 'Mike Johnson',
        content: 'The app is good but could use some improvements in the UI.',
        title: 'Good app, needs UI improvements',
        rating: 4,
        sentiment: 'neutral',
        sentimentScore: 0.1,
        emotions: { satisfaction: 0.5, neutral: 0.4 },
        urgency: 'medium',
        categories: ['ui-ux', 'improvement'],
        tags: ['ui', 'improvement', 'app-store'],
        language: 'en',
        location: 'UK',
        device: 'mobile',
        platform: 'android',
        metadata: { browser: 'Chrome Mobile', os: 'Android' },
        isProcessed: true,
        processingStatus: 'completed',
        aiInsights: { summary: 'Mixed feedback about UI, room for improvement', actionItems: ['Review UI/UX design', 'Consider user interface updates'] },
        isResolved: false,
        originalData: {}
      }
    ];

    for (const feedback of sampleFeedback) {
      await Feedback.create(feedback);
    }

    console.log('✅ Sample feedback data created.');

    console.log('🎉 Database initialization completed successfully!');
    console.log('📊 Available tables:');
    console.log('   - Users');
    console.log('   - Feedback');
    console.log('   - Integrations');
    console.log('   - Alerts');
    console.log('   - Tasks');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the initialization
initializeDatabase(); 