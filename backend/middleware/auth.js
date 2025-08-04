const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware to check if user has required permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permission,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware to check subscription limits
const checkSubscriptionLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      // Check if user has active subscription
      if (user.subscriptionStatus !== 'active') {
        return res.status(403).json({
          error: 'Subscription required',
          code: 'SUBSCRIPTION_REQUIRED'
        });
      }

      // Check monthly feedback limit
      if (limitType === 'feedback') {
        const currentMonth = new Date().getFullYear() * 100 + new Date().getMonth() + 1;
        const feedbackCount = await require('../models/Feedback').count({
          where: {
            userId: user.id,
            createdAt: {
              [require('sequelize').Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        });

        if (feedbackCount >= user.monthlyFeedbackLimit) {
          return res.status(403).json({
            error: 'Monthly feedback limit reached',
            code: 'FEEDBACK_LIMIT_REACHED',
            limit: user.monthlyFeedbackLimit,
            used: feedbackCount
          });
        }
      }

      // Check integrations limit
      if (limitType === 'integrations') {
        const integrationsCount = await require('../models/Integration').count({
          where: { userId: user.id, isActive: true }
        });

        if (integrationsCount >= user.integrationsLimit) {
          return res.status(403).json({
            error: 'Integrations limit reached',
            code: 'INTEGRATIONS_LIMIT_REACHED',
            limit: user.integrationsLimit,
            used: integrationsCount
          });
        }
      }

      next();
    } catch (error) {
      console.error('Subscription limit check error:', error);
      return res.status(500).json({
        error: 'Error checking subscription limits',
        code: 'LIMIT_CHECK_ERROR'
      });
    }
  };
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// Middleware to check if user is manager or admin
const requireManager = (req, res, next) => {
  if (!req.user || !['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Manager access required',
      code: 'MANAGER_REQUIRED'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requirePermission,
  checkSubscriptionLimit,
  requireAdmin,
  requireManager
}; 