const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const whiteLabelService = require('../services/whiteLabelService');

const router = express.Router();

// Get white label configuration
router.get('/config', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const config = await whiteLabelService.getWhiteLabelConfig(req.user.id);

  res.json({
    success: config.success,
    data: config.data
  });
}));

// Update white label configuration
router.put('/config', [
  authenticateToken,
  body('config').isObject().withMessage('Config must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { config } = req.body;
  const result = await whiteLabelService.updateWhiteLabelConfig(req.user.id, config);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Update theme
router.put('/theme', [
  authenticateToken,
  body('theme').isObject().withMessage('Theme must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { theme } = req.body;
  const result = await whiteLabelService.updateTheme(req.user.id, theme);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Update branding
router.put('/branding', [
  authenticateToken,
  body('branding').isObject().withMessage('Branding must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { branding } = req.body;
  const result = await whiteLabelService.updateBranding(req.user.id, branding);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Update custom CSS
router.put('/css', [
  authenticateToken,
  body('css').optional().isString().withMessage('CSS must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { css } = req.body;
  const result = await whiteLabelService.updateCustomCSS(req.user.id, css);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Update custom JavaScript
router.put('/js', [
  authenticateToken,
  body('js').optional().isString().withMessage('JavaScript must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { js } = req.body;
  const result = await whiteLabelService.updateCustomJS(req.user.id, js);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Update email templates
router.put('/email-templates', [
  authenticateToken,
  body('templates').isObject().withMessage('Templates must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { templates } = req.body;
  const result = await whiteLabelService.updateEmailTemplates(req.user.id, templates);

  res.json({
    success: result.success,
    data: result.data
  });
}));

// Get available themes
router.get('/themes', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const themes = whiteLabelService.getAvailableThemes();

  res.json({
    success: true,
    data: themes
  });
}));

// Get email template types
router.get('/email-template-types', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const templateTypes = whiteLabelService.getEmailTemplateTypes();

  res.json({
    success: true,
    data: templateTypes
  });
}));

// Get custom report templates
router.get('/report-templates', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const templates = whiteLabelService.getCustomReportTemplates();

  res.json({
    success: true,
    data: templates
  });
}));

// Get white label features
router.get('/features', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const features = whiteLabelService.getWhiteLabelFeatures();

  res.json({
    success: true,
    data: features
  });
}));

// Generate CSS variables
router.post('/generate-css', [
  authenticateToken,
  body('theme').isObject().withMessage('Theme must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { theme } = req.body;
  const cssVariables = whiteLabelService.generateCSSVariables(theme);

  res.json({
    success: true,
    data: {
      css: cssVariables
    }
  });
}));

// Apply custom CSS
router.post('/apply-css', [
  authenticateToken,
  body('css').optional().isString().withMessage('CSS must be a string'),
  body('theme').isObject().withMessage('Theme must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { css, theme } = req.body;
  const appliedCSS = whiteLabelService.applyCustomCSS(css, theme);

  res.json({
    success: true,
    data: {
      css: appliedCSS
    }
  });
}));

// Validate theme
router.post('/validate-theme', [
  authenticateToken,
  body('theme').isObject().withMessage('Theme must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { theme } = req.body;
  const validation = whiteLabelService.validateTheme(theme);

  res.json({
    success: validation.valid,
    data: validation
  });
}));

// Validate branding
router.post('/validate-branding', [
  authenticateToken,
  body('branding').isObject().withMessage('Branding must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { branding } = req.body;
  const validation = whiteLabelService.validateBranding(branding);

  res.json({
    success: validation.valid,
    data: validation
  });
}));

// Validate CSS
router.post('/validate-css', [
  authenticateToken,
  body('css').optional().isString().withMessage('CSS must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { css } = req.body;
  const validation = whiteLabelService.validateCSS(css);

  res.json({
    success: validation.valid,
    data: validation
  });
}));

// Validate JavaScript
router.post('/validate-js', [
  authenticateToken,
  body('js').optional().isString().withMessage('JavaScript must be a string')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { js } = req.body;
  const validation = whiteLabelService.validateJS(js);

  res.json({
    success: validation.valid,
    data: validation
  });
}));

// Get default email template
router.get('/email-template/:type', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const { type } = req.params;
  const template = whiteLabelService.getDefaultEmailTemplate(type);

  res.json({
    success: true,
    data: {
      type,
      template
    }
  });
}));

// Preview theme
router.post('/preview-theme', [
  authenticateToken,
  body('theme').isObject().withMessage('Theme must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { theme } = req.body;
  const cssVariables = whiteLabelService.generateCSSVariables(theme);

  res.json({
    success: true,
    data: {
      css: cssVariables,
      theme
    }
  });
}));

// Export configuration
router.get('/export', [
  authenticateToken
], asyncHandler(async (req, res) => {
  const config = await whiteLabelService.getWhiteLabelConfig(req.user.id);

  if (!config.success) {
    return res.status(400).json({
      success: false,
      error: 'Could not get configuration'
    });
  }

  res.json({
    success: true,
    data: {
      configuration: config.data,
      exportDate: new Date().toISOString()
    }
  });
}));

// Import configuration
router.post('/import', [
  authenticateToken,
  body('configuration').isObject().withMessage('Configuration must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }

  const { configuration } = req.body;
  const result = await whiteLabelService.updateWhiteLabelConfig(req.user.id, configuration);

  res.json({
    success: result.success,
    data: result.data
  });
}));

module.exports = router; 