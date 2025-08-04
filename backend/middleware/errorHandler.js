const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message: 'Validation Error',
      details: message,
      code: 'VALIDATION_ERROR'
    };
    return res.status(400).json(error);
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      message: 'Duplicate Entry',
      details: message,
      code: 'DUPLICATE_ENTRY'
    };
    return res.status(400).json(error);
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = {
      message: 'Referenced record not found',
      details: err.message,
      code: 'FOREIGN_KEY_ERROR'
    };
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    };
    return res.status(401).json(error);
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = {
      message: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.headers?.['retry-after']
    };
    return res.status(429).json(error);
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'File too large',
      code: 'FILE_SIZE_LIMIT',
      maxSize: process.env.MAX_FILE_SIZE || '10MB'
    };
    return res.status(400).json(error);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Unexpected file field',
      code: 'UNEXPECTED_FILE_FIELD'
    };
    return res.status(400).json(error);
  }

  // OpenAI API errors
  if (err.status === 429) {
    error = {
      message: 'AI service rate limit exceeded',
      code: 'AI_RATE_LIMIT',
      retryAfter: 60
    };
    return res.status(429).json(error);
  }

  if (err.status === 500 && err.message?.includes('OpenAI')) {
    error = {
      message: 'AI service temporarily unavailable',
      code: 'AI_SERVICE_ERROR'
    };
    return res.status(503).json(error);
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED' && err.message?.includes('database')) {
    error = {
      message: 'Database connection failed',
      code: 'DB_CONNECTION_ERROR'
    };
    return res.status(503).json(error);
  }

  // Redis connection errors
  if (err.code === 'ECONNREFUSED' && err.message?.includes('redis')) {
    error = {
      message: 'Cache service unavailable',
      code: 'CACHE_ERROR'
    };
    return res.status(503).json(error);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  notFound
}; 