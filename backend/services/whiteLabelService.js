const User = require('../models/User');
const { redisClient } = require('../config/database');

class WhiteLabelService {
  constructor() {
    this.defaultTheme = {
      primary: '#3B82F6',
      secondary: '#1E40AF',
      accent: '#F59E0B',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280'
    };

    this.defaultBranding = {
      logo: null,
      favicon: null,
      companyName: 'InsightPulse',
      tagline: 'Customer Intelligence Platform',
      domain: null,
      customCSS: null,
      customJS: null
    };

    this.supportedFeatures = {
      customBranding: true,
      customDomain: true,
      customTheme: true,
      customCSS: true,
      customJS: true,
      customEmailTemplates: true,
      customReports: true,
      customIntegrations: true,
      customAPI: true
    };
  }

  // Get white label configuration for user
  async getWhiteLabelConfig(userId) {
    try {
      // Mock data for now
      const config = {
        enabled: true,
        theme: this.defaultTheme,
        branding: this.defaultBranding,
        features: this.supportedFeatures,
        customizations: {
          logo: 'https://example.com/logo.png',
          favicon: 'https://example.com/favicon.ico',
          companyName: 'Acme Corp',
          tagline: 'Customer Feedback Analytics',
          domain: 'feedback.acmecorp.com',
          customCSS: null,
          customJS: null
        },
        emailTemplates: {
          welcome: this.getDefaultEmailTemplate('welcome'),
          weeklySummary: this.getDefaultEmailTemplate('weekly_summary'),
          alert: this.getDefaultEmailTemplate('alert')
        },
        reports: {
          customTemplates: [],
          customMetrics: [],
          customCharts: []
        }
      };

      return {
        success: true,
        data: config
      };
    } catch (error) {
      console.error('Error getting white label config:', error);
      return { success: false, error: error.message };
    }
  }

  // Update white label configuration
  async updateWhiteLabelConfig(userId, config) {
    try {
      const validation = this.validateConfig(config);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      console.log('Updating white label config for user:', userId, config);

      return {
        success: true,
        data: {
          message: 'White label configuration updated successfully',
          config
        }
      };
    } catch (error) {
      console.error('Error updating white label config:', error);
      return { success: false, error: error.message };
    }
  }

  // Update theme
  async updateTheme(userId, theme) {
    try {
      const validation = this.validateTheme(theme);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const currentConfig = await this.getWhiteLabelConfig(userId);
      if (!currentConfig.success) {
        return currentConfig;
      }

      const updatedConfig = {
        ...currentConfig.data,
        theme: { ...currentConfig.data.theme, ...theme }
      };

      return await this.updateWhiteLabelConfig(userId, updatedConfig);
    } catch (error) {
      console.error('Error updating theme:', error);
      return { success: false, error: error.message };
    }
  }

  // Update branding
  async updateBranding(userId, branding) {
    try {
      const validation = this.validateBranding(branding);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const currentConfig = await this.getWhiteLabelConfig(userId);
      if (!currentConfig.success) {
        return currentConfig;
      }

      const updatedConfig = {
        ...currentConfig.data,
        branding: { ...currentConfig.data.branding, ...branding }
      };

      return await this.updateWhiteLabelConfig(userId, updatedConfig);
    } catch (error) {
      console.error('Error updating branding:', error);
      return { success: false, error: error.message };
    }
  }

  // Update custom CSS
  async updateCustomCSS(userId, css) {
    try {
      const validation = this.validateCSS(css);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const currentConfig = await this.getWhiteLabelConfig(userId);
      if (!currentConfig.success) {
        return currentConfig;
      }

      const updatedConfig = {
        ...currentConfig.data,
        customizations: {
          ...currentConfig.data.customizations,
          customCSS: css
        }
      };

      return await this.updateWhiteLabelConfig(userId, updatedConfig);
    } catch (error) {
      console.error('Error updating custom CSS:', error);
      return { success: false, error: error.message };
    }
  }

  // Update custom JavaScript
  async updateCustomJS(userId, js) {
    try {
      const validation = this.validateJS(js);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const currentConfig = await this.getWhiteLabelConfig(userId);
      if (!currentConfig.success) {
        return currentConfig;
      }

      const updatedConfig = {
        ...currentConfig.data,
        customizations: {
          ...currentConfig.data.customizations,
          customJS: js
        }
      };

      return await this.updateWhiteLabelConfig(userId, updatedConfig);
    } catch (error) {
      console.error('Error updating custom JS:', error);
      return { success: false, error: error.message };
    }
  }

  // Update email templates
  async updateEmailTemplates(userId, templates) {
    try {
      const validation = this.validateEmailTemplates(templates);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const currentConfig = await this.getWhiteLabelConfig(userId);
      if (!currentConfig.success) {
        return currentConfig;
      }

      const updatedConfig = {
        ...currentConfig.data,
        emailTemplates: { ...currentConfig.data.emailTemplates, ...templates }
      };

      return await this.updateWhiteLabelConfig(userId, updatedConfig);
    } catch (error) {
      console.error('Error updating email templates:', error);
      return { success: false, error: error.message };
    }
  }

  // Get available themes
  getAvailableThemes() {
    return [
      {
        id: 'default',
        name: 'Default Blue',
        colors: this.defaultTheme,
        preview: '/themes/default.png'
      },
      {
        id: 'green',
        name: 'Green Theme',
        colors: {
          primary: '#10B981',
          secondary: '#059669',
          accent: '#F59E0B',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#111827',
          textSecondary: '#6B7280'
        },
        preview: '/themes/green.png'
      },
      {
        id: 'purple',
        name: 'Purple Theme',
        colors: {
          primary: '#8B5CF6',
          secondary: '#7C3AED',
          accent: '#F59E0B',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#111827',
          textSecondary: '#6B7280'
        },
        preview: '/themes/purple.png'
      },
      {
        id: 'dark',
        name: 'Dark Theme',
        colors: {
          primary: '#3B82F6',
          secondary: '#1E40AF',
          accent: '#F59E0B',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          background: '#1F2937',
          surface: '#374151',
          text: '#F9FAFB',
          textSecondary: '#D1D5DB'
        },
        preview: '/themes/dark.png'
      }
    ];
  }

  // Get email template types
  getEmailTemplateTypes() {
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        description: 'Sent to new users when they sign up',
        variables: ['userName', 'companyName', 'loginUrl']
      },
      {
        id: 'weekly_summary',
        name: 'Weekly Summary',
        description: 'Weekly feedback summary email',
        variables: ['totalFeedback', 'satisfactionRate', 'topIssues', 'summaryUrl']
      },
      {
        id: 'alert',
        name: 'Alert Email',
        description: 'Sent for important alerts and notifications',
        variables: ['alertType', 'alertMessage', 'actionUrl', 'timestamp']
      },
      {
        id: 'report',
        name: 'Report Email',
        description: 'Scheduled report delivery email',
        variables: ['reportName', 'reportUrl', 'generatedAt', 'recipientName']
      }
    ];
  }

  // Get custom report templates
  getCustomReportTemplates() {
    return [
      {
        id: 'executive_summary',
        name: 'Executive Summary',
        description: 'High-level overview for executives',
        sections: ['metrics', 'trends', 'insights', 'recommendations'],
        customizable: true
      },
      {
        id: 'customer_satisfaction',
        name: 'Customer Satisfaction',
        description: 'Detailed satisfaction analysis',
        sections: ['nps', 'sentiment', 'segments', 'drivers'],
        customizable: true
      },
      {
        id: 'feedback_trends',
        name: 'Feedback Trends',
        description: 'Trend analysis and forecasting',
        sections: ['volume', 'sentiment', 'categories', 'forecasting'],
        customizable: true
      }
    ];
  }

  // Validate configuration
  validateConfig(config) {
    if (!config || typeof config !== 'object') {
      return { valid: false, error: 'Invalid configuration object' };
    }

    if (config.theme && !this.validateTheme(config.theme).valid) {
      return this.validateTheme(config.theme);
    }

    if (config.branding && !this.validateBranding(config.branding).valid) {
      return this.validateBranding(config.branding);
    }

    return { valid: true };
  }

  // Validate theme
  validateTheme(theme) {
    if (!theme || typeof theme !== 'object') {
      return { valid: false, error: 'Invalid theme object' };
    }

    const requiredColors = ['primary', 'secondary', 'accent', 'success', 'warning', 'error'];
    for (const color of requiredColors) {
      if (!theme[color] || !this.isValidColor(theme[color])) {
        return { valid: false, error: `Invalid color for ${color}` };
      }
    }

    return { valid: true };
  }

  // Validate branding
  validateBranding(branding) {
    if (!branding || typeof branding !== 'object') {
      return { valid: false, error: 'Invalid branding object' };
    }

    if (branding.companyName && typeof branding.companyName !== 'string') {
      return { valid: false, error: 'Company name must be a string' };
    }

    if (branding.logo && !this.isValidUrl(branding.logo)) {
      return { valid: false, error: 'Invalid logo URL' };
    }

    if (branding.favicon && !this.isValidUrl(branding.favicon)) {
      return { valid: false, error: 'Invalid favicon URL' };
    }

    return { valid: true };
  }

  // Validate CSS
  validateCSS(css) {
    if (css && typeof css !== 'string') {
      return { valid: false, error: 'CSS must be a string' };
    }

    if (css && css.length > 10000) {
      return { valid: false, error: 'CSS too large (max 10KB)' };
    }

    return { valid: true };
  }

  // Validate JavaScript
  validateJS(js) {
    if (js && typeof js !== 'string') {
      return { valid: false, error: 'JavaScript must be a string' };
    }

    if (js && js.length > 10000) {
      return { valid: false, error: 'JavaScript too large (max 10KB)' };
    }

    return { valid: true };
  }

  // Validate email templates
  validateEmailTemplates(templates) {
    if (!templates || typeof templates !== 'object') {
      return { valid: false, error: 'Invalid email templates object' };
    }

    for (const [key, template] of Object.entries(templates)) {
      if (typeof template !== 'string') {
        return { valid: false, error: `Template ${key} must be a string` };
      }

      if (template.length > 50000) {
        return { valid: false, error: `Template ${key} too large (max 50KB)` };
      }
    }

    return { valid: true };
  }

  // Helper methods
  isValidColor(color) {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$|^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
    return colorRegex.test(color);
  }

  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getDefaultEmailTemplate(type) {
    const templates = {
      welcome: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Welcome to {{companyName}}</title>
        </head>
        <body>
          <h1>Welcome to {{companyName}}!</h1>
          <p>Hi {{userName}},</p>
          <p>Welcome to {{companyName}}! We're excited to help you understand your customers better.</p>
          <p><a href="{{loginUrl}}">Get Started</a></p>
        </body>
        </html>
      `,
      weekly_summary: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Weekly Summary - {{companyName}}</title>
        </head>
        <body>
          <h1>Your Weekly Feedback Summary</h1>
          <p>Here's what happened this week:</p>
          <ul>
            <li>Total Feedback: {{totalFeedback}}</li>
            <li>Satisfaction Rate: {{satisfactionRate}}%</li>
            <li>Top Issues: {{topIssues}}</li>
          </ul>
          <p><a href="{{summaryUrl}}">View Full Summary</a></p>
        </body>
        </html>
      `,
      alert: `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Alert - {{companyName}}</title>
        </head>
        <body>
          <h1>Alert: {{alertType}}</h1>
          <p>{{alertMessage}}</p>
          <p><a href="{{actionUrl}}">Take Action</a></p>
          <p>Time: {{timestamp}}</p>
        </body>
        </html>
      `
    };

    return templates[type] || '';
  }

  // Generate CSS variables from theme
  generateCSSVariables(theme) {
    return `
      :root {
        --color-primary: ${theme.primary};
        --color-secondary: ${theme.secondary};
        --color-accent: ${theme.accent};
        --color-success: ${theme.success};
        --color-warning: ${theme.warning};
        --color-error: ${theme.error};
        --color-background: ${theme.background};
        --color-surface: ${theme.surface};
        --color-text: ${theme.text};
        --color-text-secondary: ${theme.textSecondary};
      }
    `;
  }

  // Apply custom CSS
  applyCustomCSS(css, theme) {
    const cssVariables = this.generateCSSVariables(theme);
    return `${cssVariables}\n${css || ''}`;
  }

  // Get white label features
  getWhiteLabelFeatures() {
    return {
      branding: {
        name: 'Custom Branding',
        description: 'Customize logos, colors, and company information',
        enabled: true,
        features: ['logo', 'favicon', 'companyName', 'tagline', 'domain']
      },
      theming: {
        name: 'Custom Theming',
        description: 'Customize colors and visual appearance',
        enabled: true,
        features: ['colorScheme', 'typography', 'spacing', 'components']
      },
      customization: {
        name: 'Custom Code',
        description: 'Add custom CSS and JavaScript',
        enabled: true,
        features: ['customCSS', 'customJS', 'analytics', 'tracking']
      },
      email: {
        name: 'Custom Email Templates',
        description: 'Customize email templates and branding',
        enabled: true,
        features: ['welcome', 'weekly', 'alerts', 'reports']
      },
      reports: {
        name: 'Custom Reports',
        description: 'Create custom report templates and metrics',
        enabled: true,
        features: ['templates', 'metrics', 'charts', 'scheduling']
      },
      integrations: {
        name: 'Custom Integrations',
        description: 'Build custom integrations and webhooks',
        enabled: true,
        features: ['webhooks', 'apis', 'connectors', 'automations']
      }
    };
  }
}

module.exports = new WhiteLabelService(); 