const { Sequelize } = require('sequelize');
const Redis = require('redis');
const path = require('path');

// Use SQLite for development, PostgreSQL for production
const isDevelopment = process.env.NODE_ENV !== 'production';

let sequelize;

if (isDevelopment) {
  // SQLite configuration for development
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../database.sqlite'),
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
    }
  });
  console.log('📦 Using SQLite database for development');
} else {
  // PostgreSQL configuration for production
  sequelize = new Sequelize(
    process.env.DATABASE_URL || 'postgresql://localhost:5432/insightpulse',
    {
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    }
  );
  console.log('🐘 Using PostgreSQL database for production');
}

// Redis configuration for caching
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Connect to Redis
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

// Initialize Redis connection
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

module.exports = {
  sequelize,
  redisClient
}; 