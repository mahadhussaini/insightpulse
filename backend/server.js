const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');
const analyticsRoutes = require('./routes/analytics');
const alertsRoutes = require('./routes/alerts');
const integrationsRoutes = require('./routes/integrations');
const webhooksRoutes = require('./routes/webhooks');
const dashboardRoutes = require('./routes/dashboard');

// Import middleware
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Import database connection
const { sequelize } = require('./config/database');

// Import models for database initialization
const User = require('./models/User');
const Feedback = require('./models/Feedback');
const Integration = require('./models/Integration');
const Alert = require('./models/Alert');
const Task = require('./models/Task');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'InsightPulse API'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/feedback', authenticateToken, feedbackRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/alerts', authenticateToken, alertsRoutes);
app.use('/api/integrations', authenticateToken, integrationsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('join-dashboard', (userId) => {
    socket.join(`user-${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

const PORT = process.env.PORT || 5000;

// Database connection and server startup
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync database models in dependency order (in production, use migrations)
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Syncing database models...');
      
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
      
      console.log('✅ Database models synchronized.');
    }
    
    server.listen(PORT, () => {
      console.log(`🚀 InsightPulse API server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  server.close(() => {
    console.log('Process terminated');
  });
});

startServer();

module.exports = { app, io }; 