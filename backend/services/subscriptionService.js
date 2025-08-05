const { redisClient } = require('../config/database');

class SubscriptionService {
  constructor() {
    this.plans = {
      FREE: 'free',
      STARTER: 'starter',
      PROFESSIONAL: 'professional',
      ENTERPRISE: 'enterprise'
    };
    
    this.features = {
      FEEDBACK_ANALYSIS: 'feedback_analysis',
      AI_INSIGHTS: 'ai_insights',
      SEGMENTATION: 'segmentation',
      CHURN_PREDICTION: 'churn_prediction',
      SLACK_INTEGRATION: 'slack_integration',
      ADVANCED_ANALYTICS: 'advanced_analytics',
      CUSTOM_INTEGRATIONS: 'custom_integrations',
      WHITE_LABEL: 'white_label',
      API_ACCESS: 'api_access',
      PRIORITY_SUPPORT: 'priority_support'
    };
    
    this.limits = {
      [this.plans.FREE]: {
        name: 'Free',
        price: 0,
        features: [
          this.features.FEEDBACK_ANALYSIS
        ],
        limits: {
          feedbackPerMonth: 100,
          aiQueriesPerMonth: 10,
          integrations: 1,
          users: 1,
          retention: '7 days'
        }
      },
      [this.plans.STARTER]: {
        name: 'Starter',
        price: 29,
        features: [
          this.features.FEEDBACK_ANALYSIS,
          this.features.AI_INSIGHTS,
          this.features.SEGMENTATION
        ],
        limits: {
          feedbackPerMonth: 1000,
          aiQueriesPerMonth: 100,
          integrations: 3,
          users: 3,
          retention: '30 days'
        }
      },
      [this.plans.PROFESSIONAL]: {
        name: 'Professional',
        price: 99,
        features: [
          this.features.FEEDBACK_ANALYSIS,
          this.features.AI_INSIGHTS,
          this.features.SEGMENTATION,
          this.features.CHURN_PREDICTION,
          this.features.SLACK_INTEGRATION,
          this.features.ADVANCED_ANALYTICS
        ],
        limits: {
          feedbackPerMonth: 10000,
          aiQueriesPerMonth: 500,
          integrations: 10,
          users: 10,
          retention: '90 days'
        }
      },
      [this.plans.ENTERPRISE]: {
        name: 'Enterprise',
        price: 299,
        features: [
          this.features.FEEDBACK_ANALYSIS,
          this.features.AI_INSIGHTS,
          this.features.SEGMENTATION,
          this.features.CHURN_PREDICTION,
          this.features.SLACK_INTEGRATION,
          this.features.ADVANCED_ANALYTICS,
          this.features.CUSTOM_INTEGRATIONS,
          this.features.WHITE_LABEL,
          this.features.API_ACCESS,
          this.features.PRIORITY_SUPPORT
        ],
        limits: {
          feedbackPerMonth: 100000,
          aiQueriesPerMonth: 2000,
          integrations: -1, // Unlimited
          users: -1, // Unlimited
          retention: '1 year'
        }
      }
    };
  }

  // Get user's current subscription
  async getUserSubscription(userId) {
    try {
      // In a real implementation, this would query the database
      // For now, return mock data
      const subscription = {
        plan: this.plans.PROFESSIONAL,
        status: 'active',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000), // 335 days from now
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        usage: {
          feedbackThisMonth: 2347,
          aiQueriesThisMonth: 156,
          integrationsUsed: 4,
          usersActive: 3
        }
      };

      return {
        success: true,
        data: subscription
      };
    } catch (error) {
      console.error('Error getting user subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all available plans
  async getPlans() {
    try {
      const plans = Object.entries(this.limits).map(([key, plan]) => ({
        id: key,
        name: plan.name,
        price: plan.price,
        features: plan.features,
        limits: plan.limits,
        popular: key === this.plans.PROFESSIONAL
      }));

      return {
        success: true,
        data: plans
      };
    } catch (error) {
      console.error('Error getting plans:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user has access to a feature
  async hasFeatureAccess(userId, feature) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription.success) {
        return { success: false, hasAccess: false };
      }

      const plan = this.limits[subscription.data.plan];
      const hasAccess = plan.features.includes(feature);

      return {
        success: true,
        hasAccess,
        plan: subscription.data.plan
      };
    } catch (error) {
      console.error('Error checking feature access:', error);
      return { success: false, hasAccess: false };
    }
  }

  // Check usage limits
  async checkUsageLimits(userId, feature) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription.success) {
        return { success: false, withinLimits: false };
      }

      const plan = this.limits[subscription.data.plan];
      const usage = subscription.data.usage;

      let withinLimits = true;
      let limitExceeded = null;

      switch (feature) {
        case 'feedback':
          if (plan.limits.feedbackPerMonth !== -1 && usage.feedbackThisMonth >= plan.limits.feedbackPerMonth) {
            withinLimits = false;
            limitExceeded = 'feedback';
          }
          break;
        case 'ai_queries':
          if (plan.limits.aiQueriesPerMonth !== -1 && usage.aiQueriesThisMonth >= plan.limits.aiQueriesPerMonth) {
            withinLimits = false;
            limitExceeded = 'ai_queries';
          }
          break;
        case 'integrations':
          if (plan.limits.integrations !== -1 && usage.integrationsUsed >= plan.limits.integrations) {
            withinLimits = false;
            limitExceeded = 'integrations';
          }
          break;
        case 'users':
          if (plan.limits.users !== -1 && usage.usersActive >= plan.limits.users) {
            withinLimits = false;
            limitExceeded = 'users';
          }
          break;
      }

      return {
        success: true,
        withinLimits,
        limitExceeded,
        currentUsage: usage,
        limits: plan.limits
      };
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return { success: false, withinLimits: false };
    }
  }

  // Upgrade subscription
  async upgradeSubscription(userId, newPlan, billingCycle = 'monthly') {
    try {
      // In a real implementation, this would integrate with a payment processor
      // and update the database
      console.log(`Upgrading user ${userId} to ${newPlan} plan`);

      const subscription = {
        plan: newPlan,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        billingCycle,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        usage: {
          feedbackThisMonth: 0,
          aiQueriesThisMonth: 0,
          integrationsUsed: 0,
          usersActive: 1
        }
      };

      return {
        success: true,
        data: {
          message: 'Subscription upgraded successfully',
          subscription
        }
      };
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Cancel subscription
  async cancelSubscription(userId) {
    try {
      // In a real implementation, this would update the database
      console.log(`Cancelling subscription for user ${userId}`);

      return {
        success: true,
        data: {
          message: 'Subscription cancelled successfully',
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      };
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, error: error.message };
    }
  }

  // Get billing history
  async getBillingHistory(userId) {
    try {
      // Mock billing history
      const history = [
        {
          id: '1',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          amount: 99,
          plan: 'Professional',
          status: 'paid',
          invoiceUrl: '#'
        },
        {
          id: '2',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          amount: 99,
          plan: 'Professional',
          status: 'paid',
          invoiceUrl: '#'
        },
        {
          id: '3',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          amount: 29,
          plan: 'Starter',
          status: 'paid',
          invoiceUrl: '#'
        }
      ];

      return {
        success: true,
        data: history
      };
    } catch (error) {
      console.error('Error getting billing history:', error);
      return { success: false, error: error.message };
    }
  }

  // Get feature comparison
  async getFeatureComparison() {
    try {
      const plans = Object.entries(this.limits);
      const features = Object.values(this.features);

      const comparison = features.map(feature => {
        const featureData = {
          name: feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          id: feature,
          plans: {}
        };

        plans.forEach(([planKey, plan]) => {
          featureData.plans[planKey] = plan.features.includes(feature);
        });

        return featureData;
      });

      return {
        success: true,
        data: comparison
      };
    } catch (error) {
      console.error('Error getting feature comparison:', error);
      return { success: false, error: error.message };
    }
  }

  // Get usage analytics
  async getUsageAnalytics(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription.success) {
        return { success: false, error: 'Could not get subscription data' };
      }

      const plan = this.limits[subscription.data.plan];
      const usage = subscription.data.usage;

      const analytics = {
        feedback: {
          used: usage.feedbackThisMonth,
          limit: plan.limits.feedbackPerMonth,
          percentage: plan.limits.feedbackPerMonth === -1 ? 0 : (usage.feedbackThisMonth / plan.limits.feedbackPerMonth) * 100
        },
        aiQueries: {
          used: usage.aiQueriesThisMonth,
          limit: plan.limits.aiQueriesPerMonth,
          percentage: plan.limits.aiQueriesPerMonth === -1 ? 0 : (usage.aiQueriesThisMonth / plan.limits.aiQueriesPerMonth) * 100
        },
        integrations: {
          used: usage.integrationsUsed,
          limit: plan.limits.integrations,
          percentage: plan.limits.integrations === -1 ? 0 : (usage.integrationsUsed / plan.limits.integrations) * 100
        },
        users: {
          used: usage.usersActive,
          limit: plan.limits.users,
          percentage: plan.limits.users === -1 ? 0 : (usage.usersActive / plan.limits.users) * 100
        }
      };

      return {
        success: true,
        data: analytics
      };
    } catch (error) {
      console.error('Error getting usage analytics:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate subscription status
  async validateSubscription(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription.success) {
        return { valid: false, reason: 'No subscription found' };
      }

      const now = new Date();
      const endDate = new Date(subscription.data.endDate);

      if (endDate < now) {
        return { valid: false, reason: 'Subscription expired' };
      }

      if (subscription.data.status !== 'active') {
        return { valid: false, reason: 'Subscription not active' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Error validating subscription:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  // Get plan recommendations
  async getPlanRecommendations(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      const usageAnalytics = await this.getUsageAnalytics(userId);
      
      if (!subscription.success || !usageAnalytics.success) {
        return { success: false, recommendations: [] };
      }

      const recommendations = [];
      const analytics = usageAnalytics.data;
      const currentPlan = subscription.data.plan;

      // Check if user is approaching limits
      if (analytics.feedback.percentage > 80) {
        recommendations.push({
          type: 'upgrade',
          reason: 'High feedback volume',
          currentPlan,
          recommendedPlan: this.getNextPlan(currentPlan),
          priority: 'high'
        });
      }

      if (analytics.aiQueries.percentage > 80) {
        recommendations.push({
          type: 'upgrade',
          reason: 'High AI query usage',
          currentPlan,
          recommendedPlan: this.getNextPlan(currentPlan),
          priority: 'medium'
        });
      }

      if (analytics.integrations.percentage > 80) {
        recommendations.push({
          type: 'upgrade',
          reason: 'Many integrations needed',
          currentPlan,
          recommendedPlan: this.getNextPlan(currentPlan),
          priority: 'medium'
        });
      }

      // Check if user could downgrade
      if (analytics.feedback.percentage < 30 && analytics.aiQueries.percentage < 30) {
        const lowerPlan = this.getPreviousPlan(currentPlan);
        if (lowerPlan) {
          recommendations.push({
            type: 'downgrade',
            reason: 'Low usage',
            currentPlan,
            recommendedPlan: lowerPlan,
            priority: 'low'
          });
        }
      }

      return {
        success: true,
        data: recommendations
      };
    } catch (error) {
      console.error('Error getting plan recommendations:', error);
      return { success: false, recommendations: [] };
    }
  }

  // Helper methods
  getNextPlan(currentPlan) {
    const planOrder = [this.plans.FREE, this.plans.STARTER, this.plans.PROFESSIONAL, this.plans.ENTERPRISE];
    const currentIndex = planOrder.indexOf(currentPlan);
    return currentIndex < planOrder.length - 1 ? planOrder[currentIndex + 1] : null;
  }

  getPreviousPlan(currentPlan) {
    const planOrder = [this.plans.FREE, this.plans.STARTER, this.plans.PROFESSIONAL, this.plans.ENTERPRISE];
    const currentIndex = planOrder.indexOf(currentPlan);
    return currentIndex > 0 ? planOrder[currentIndex - 1] : null;
  }
}

module.exports = new SubscriptionService(); 