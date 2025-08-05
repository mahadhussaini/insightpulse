const { Op } = require('sequelize');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { redisClient } = require('../config/database');

class SegmentationService {
  constructor() {
    this.segmentTypes = {
      PERSONA: 'persona',
      LIFECYCLE: 'lifecycle',
      PLAN: 'plan',
      BEHAVIOR: 'behavior',
      GEOGRAPHIC: 'geographic',
      TEMPORAL: 'temporal'
    };
  }

  // Main method to segment feedback data
  async segmentFeedback(userId, segmentType, options = {}) {
    try {
      const {
        timeRange = '30d',
        source = 'all',
        limit = 1000,
        includeMetadata = true
      } = options;

      // Get feedback data
      const feedbackData = await this.gatherFeedbackData(userId, {
        timeRange,
        source,
        limit
      });

      // Apply segmentation based on type
      let segments;
      switch (segmentType) {
        case this.segmentTypes.PERSONA:
          segments = await this.segmentByPersona(feedbackData);
          break;
        case this.segmentTypes.LIFECYCLE:
          segments = await this.segmentByLifecycle(feedbackData);
          break;
        case this.segmentTypes.PLAN:
          segments = await this.segmentByPlan(feedbackData);
          break;
        case this.segmentTypes.BEHAVIOR:
          segments = await this.segmentByBehavior(feedbackData);
          break;
        case this.segmentTypes.GEOGRAPHIC:
          segments = await this.segmentByGeographic(feedbackData);
          break;
        case this.segmentTypes.TEMPORAL:
          segments = await this.segmentByTemporal(feedbackData);
          break;
        default:
          throw new Error(`Unknown segment type: ${segmentType}`);
      }

      return {
        segmentType,
        segments,
        metadata: includeMetadata ? {
          totalFeedback: feedbackData.length,
          timeRange,
          source,
          segmentCount: segments.length
        } : undefined
      };
    } catch (error) {
      console.error('Segmentation error:', error);
      throw error;
    }
  }

  // Gather feedback data with filters
  async gatherFeedbackData(userId, filters) {
    const { timeRange, source, limit } = filters;
    
    const whereClause = { userId };
    
    // Source filter
    if (source && source !== 'all') {
      whereClause.source = source;
    }

    // Time range filter
    if (timeRange) {
      const now = new Date();
      let startDate;
      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      whereClause.createdAt = { [Op.gte]: startDate };
    }

    return await Feedback.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
  }

  // Segment by user persona (based on feedback patterns)
  async segmentByPersona(feedbackData) {
    const personas = {
      powerUser: {
        name: 'Power User',
        description: 'Highly engaged users with frequent, detailed feedback',
        criteria: {
          feedbackCount: { min: 5 },
          avgSentiment: { min: 0.3 },
          categories: ['feature_request', 'bug_report', 'improvement']
        }
      },
      casualUser: {
        name: 'Casual User',
        description: 'Occasional users with basic feedback',
        criteria: {
          feedbackCount: { min: 1, max: 4 },
          avgSentiment: { min: -0.5, max: 0.5 },
          categories: ['general', 'question', 'praise']
        }
      },
      frustratedUser: {
        name: 'Frustrated User',
        description: 'Users experiencing issues or dissatisfaction',
        criteria: {
          avgSentiment: { max: -0.3 },
          urgency: ['high', 'critical'],
          categories: ['bug_report', 'complaint', 'issue']
        }
      },
      advocate: {
        name: 'Advocate',
        description: 'Highly satisfied users who promote the product',
        criteria: {
          avgSentiment: { min: 0.7 },
          categories: ['praise', 'recommendation', 'positive_review']
        }
      },
      newUser: {
        name: 'New User',
        description: 'Recently onboarded users',
        criteria: {
          feedbackCount: { max: 2 },
          categories: ['onboarding', 'first_impression', 'tutorial']
        }
      }
    };

    const segments = [];
    
    for (const [key, persona] of Object.entries(personas)) {
      const matchingFeedback = this.filterFeedbackByCriteria(feedbackData, persona.criteria);
      
      if (matchingFeedback.length > 0) {
        const avgSentiment = this.calculateAverageSentiment(matchingFeedback);
        const topCategories = this.getTopCategories(matchingFeedback);
        const topSources = this.getTopSources(matchingFeedback);

        segments.push({
          id: key,
          name: persona.name,
          description: persona.description,
          feedback: matchingFeedback,
          stats: {
            count: matchingFeedback.length,
            percentage: (matchingFeedback.length / feedbackData.length) * 100,
            avgSentiment,
            topCategories,
            topSources,
            urgencyDistribution: this.getUrgencyDistribution(matchingFeedback)
          }
        });
      }
    }

    return segments.sort((a, b) => b.stats.count - a.stats.count);
  }

  // Segment by user lifecycle stage
  async segmentByLifecycle(feedbackData) {
    const lifecycleStages = {
      awareness: {
        name: 'Awareness',
        description: 'Users discovering the product',
        criteria: {
          categories: ['first_impression', 'discovery', 'onboarding'],
          feedbackCount: { max: 1 }
        }
      },
      consideration: {
        name: 'Consideration',
        description: 'Users evaluating the product',
        criteria: {
          categories: ['feature_request', 'question', 'comparison'],
          feedbackCount: { min: 2, max: 5 }
        }
      },
      adoption: {
        name: 'Adoption',
        description: 'Users actively using the product',
        criteria: {
          categories: ['usage', 'workflow', 'integration'],
          feedbackCount: { min: 3 }
        }
      },
      retention: {
        name: 'Retention',
        description: 'Long-term users providing ongoing feedback',
        criteria: {
          feedbackCount: { min: 5 },
          categories: ['improvement', 'optimization', 'advanced_features']
        }
      },
      churn: {
        name: 'Churn Risk',
        description: 'Users showing signs of leaving',
        criteria: {
          avgSentiment: { max: -0.5 },
          urgency: ['high', 'critical'],
          categories: ['complaint', 'cancellation', 'negative_review']
        }
      }
    };

    const segments = [];
    
    for (const [key, stage] of Object.entries(lifecycleStages)) {
      const matchingFeedback = this.filterFeedbackByCriteria(feedbackData, stage.criteria);
      
      if (matchingFeedback.length > 0) {
        const avgSentiment = this.calculateAverageSentiment(matchingFeedback);
        const topCategories = this.getTopCategories(matchingFeedback);
        const topSources = this.getTopSources(matchingFeedback);

        segments.push({
          id: key,
          name: stage.name,
          description: stage.description,
          feedback: matchingFeedback,
          stats: {
            count: matchingFeedback.length,
            percentage: (matchingFeedback.length / feedbackData.length) * 100,
            avgSentiment,
            topCategories,
            topSources,
            urgencyDistribution: this.getUrgencyDistribution(matchingFeedback)
          }
        });
      }
    }

    return segments.sort((a, b) => b.stats.count - a.stats.count);
  }

  // Segment by subscription plan (if available)
  async segmentByPlan(feedbackData) {
    // This would typically integrate with your billing system
    // For now, we'll create mock segments based on feedback patterns
    const planSegments = {
      free: {
        name: 'Free Plan',
        description: 'Users on the free tier',
        criteria: {
          categories: ['upgrade_request', 'limitation', 'feature_request'],
          avgSentiment: { max: 0.3 }
        }
      },
      starter: {
        name: 'Starter Plan',
        description: 'Users on the starter plan',
        criteria: {
          categories: ['feature_request', 'integration', 'workflow'],
          feedbackCount: { min: 2, max: 8 }
        }
      },
      professional: {
        name: 'Professional Plan',
        description: 'Users on the professional plan',
        criteria: {
          categories: ['advanced_features', 'api_request', 'enterprise'],
          feedbackCount: { min: 5 }
        }
      },
      enterprise: {
        name: 'Enterprise Plan',
        description: 'Enterprise users',
        criteria: {
          categories: ['enterprise', 'security', 'compliance', 'custom_integration'],
          urgency: ['high', 'critical']
        }
      }
    };

    const segments = [];
    
    for (const [key, plan] of Object.entries(planSegments)) {
      const matchingFeedback = this.filterFeedbackByCriteria(feedbackData, plan.criteria);
      
      if (matchingFeedback.length > 0) {
        const avgSentiment = this.calculateAverageSentiment(matchingFeedback);
        const topCategories = this.getTopCategories(matchingFeedback);
        const topSources = this.getTopSources(matchingFeedback);

        segments.push({
          id: key,
          name: plan.name,
          description: plan.description,
          feedback: matchingFeedback,
          stats: {
            count: matchingFeedback.length,
            percentage: (matchingFeedback.length / feedbackData.length) * 100,
            avgSentiment,
            topCategories,
            topSources,
            urgencyDistribution: this.getUrgencyDistribution(matchingFeedback)
          }
        });
      }
    }

    return segments.sort((a, b) => b.stats.count - a.stats.count);
  }

  // Segment by user behavior patterns
  async segmentByBehavior(feedbackData) {
    const behaviorSegments = {
      vocal: {
        name: 'Vocal Users',
        description: 'Users who provide frequent, detailed feedback',
        criteria: {
          feedbackCount: { min: 5 },
          avgContentLength: { min: 100 }
        }
      },
      silent: {
        name: 'Silent Users',
        description: 'Users who rarely provide feedback',
        criteria: {
          feedbackCount: { max: 1 },
          avgContentLength: { max: 50 }
        }
      },
      critical: {
        name: 'Critical Users',
        description: 'Users who focus on problems and issues',
        criteria: {
          avgSentiment: { max: -0.3 },
          categories: ['bug_report', 'complaint', 'issue']
        }
      },
      supportive: {
        name: 'Supportive Users',
        description: 'Users who provide positive reinforcement',
        criteria: {
          avgSentiment: { min: 0.5 },
          categories: ['praise', 'recommendation', 'positive_review']
        }
      },
      featureRequesters: {
        name: 'Feature Requesters',
        description: 'Users who frequently request new features',
        criteria: {
          categories: ['feature_request'],
          feedbackCount: { min: 2 }
        }
      }
    };

    const segments = [];
    
    for (const [key, behavior] of Object.entries(behaviorSegments)) {
      const matchingFeedback = this.filterFeedbackByCriteria(feedbackData, behavior.criteria);
      
      if (matchingFeedback.length > 0) {
        const avgSentiment = this.calculateAverageSentiment(matchingFeedback);
        const topCategories = this.getTopCategories(matchingFeedback);
        const topSources = this.getTopSources(matchingFeedback);

        segments.push({
          id: key,
          name: behavior.name,
          description: behavior.description,
          feedback: matchingFeedback,
          stats: {
            count: matchingFeedback.length,
            percentage: (matchingFeedback.length / feedbackData.length) * 100,
            avgSentiment,
            topCategories,
            topSources,
            urgencyDistribution: this.getUrgencyDistribution(matchingFeedback)
          }
        });
      }
    }

    return segments.sort((a, b) => b.stats.count - a.stats.count);
  }

  // Segment by geographic location (if available)
  async segmentByGeographic(feedbackData) {
    // This would typically use IP geolocation or user profile data
    // For now, we'll create mock segments
    const geographicSegments = {
      northAmerica: {
        name: 'North America',
        description: 'Users from North America',
        criteria: {
          // Mock criteria - would be based on actual location data
          categories: ['feature_request', 'integration']
        }
      },
      europe: {
        name: 'Europe',
        description: 'Users from Europe',
        criteria: {
          categories: ['compliance', 'gdpr', 'localization']
        }
      },
      asiaPacific: {
        name: 'Asia Pacific',
        description: 'Users from Asia Pacific',
        criteria: {
          categories: ['mobile', 'localization', 'payment']
        }
      }
    };

    const segments = [];
    
    for (const [key, region] of Object.entries(geographicSegments)) {
      const matchingFeedback = this.filterFeedbackByCriteria(feedbackData, region.criteria);
      
      if (matchingFeedback.length > 0) {
        const avgSentiment = this.calculateAverageSentiment(matchingFeedback);
        const topCategories = this.getTopCategories(matchingFeedback);
        const topSources = this.getTopSources(matchingFeedback);

        segments.push({
          id: key,
          name: region.name,
          description: region.description,
          feedback: matchingFeedback,
          stats: {
            count: matchingFeedback.length,
            percentage: (matchingFeedback.length / feedbackData.length) * 100,
            avgSentiment,
            topCategories,
            topSources,
            urgencyDistribution: this.getUrgencyDistribution(matchingFeedback)
          }
        });
      }
    }

    return segments.sort((a, b) => b.stats.count - a.stats.count);
  }

  // Segment by temporal patterns
  async segmentByTemporal(feedbackData) {
    const now = new Date();
    const temporalSegments = {
      recent: {
        name: 'Recent Users',
        description: 'Users who provided feedback in the last 7 days',
        criteria: {
          timeRange: { max: 7 * 24 * 60 * 60 * 1000 } // 7 days
        }
      },
      active: {
        name: 'Active Users',
        description: 'Users who provided feedback in the last 30 days',
        criteria: {
          timeRange: { max: 30 * 24 * 60 * 60 * 1000 } // 30 days
        }
      },
      returning: {
        name: 'Returning Users',
        description: 'Users who provided feedback multiple times',
        criteria: {
          feedbackCount: { min: 2 }
        }
      },
      seasonal: {
        name: 'Seasonal Users',
        description: 'Users with periodic feedback patterns',
        criteria: {
          // This would require more sophisticated temporal analysis
          categories: ['seasonal_feature', 'periodic_request']
        }
      }
    };

    const segments = [];
    
    for (const [key, temporal] of Object.entries(temporalSegments)) {
      const matchingFeedback = this.filterFeedbackByCriteria(feedbackData, temporal.criteria);
      
      if (matchingFeedback.length > 0) {
        const avgSentiment = this.calculateAverageSentiment(matchingFeedback);
        const topCategories = this.getTopCategories(matchingFeedback);
        const topSources = this.getTopSources(matchingFeedback);

        segments.push({
          id: key,
          name: temporal.name,
          description: temporal.description,
          feedback: matchingFeedback,
          stats: {
            count: matchingFeedback.length,
            percentage: (matchingFeedback.length / feedbackData.length) * 100,
            avgSentiment,
            topCategories,
            topSources,
            urgencyDistribution: this.getUrgencyDistribution(matchingFeedback)
          }
        });
      }
    }

    return segments.sort((a, b) => b.stats.count - a.stats.count);
  }

  // Helper methods
  filterFeedbackByCriteria(feedbackData, criteria) {
    return feedbackData.filter(feedback => {
      // Check feedback count
      if (criteria.feedbackCount) {
        const userFeedbackCount = feedbackData.filter(f => 
          f.customerEmail === feedback.customerEmail
        ).length;
        
        if (criteria.feedbackCount.min && userFeedbackCount < criteria.feedbackCount.min) return false;
        if (criteria.feedbackCount.max && userFeedbackCount > criteria.feedbackCount.max) return false;
      }

      // Check sentiment
      if (criteria.avgSentiment) {
        const userFeedback = feedbackData.filter(f => 
          f.customerEmail === feedback.customerEmail
        );
        const avgSentiment = this.calculateAverageSentiment(userFeedback);
        
        if (criteria.avgSentiment.min && avgSentiment < criteria.avgSentiment.min) return false;
        if (criteria.avgSentiment.max && avgSentiment > criteria.avgSentiment.max) return false;
      }

      // Check categories
      if (criteria.categories) {
        const hasMatchingCategory = criteria.categories.some(category =>
          feedback.categories && feedback.categories.includes(category)
        );
        if (!hasMatchingCategory) return false;
      }

      // Check urgency
      if (criteria.urgency) {
        if (!criteria.urgency.includes(feedback.urgency)) return false;
      }

      // Check content length
      if (criteria.avgContentLength) {
        const contentLength = feedback.content.length;
        if (criteria.avgContentLength.min && contentLength < criteria.avgContentLength.min) return false;
        if (criteria.avgContentLength.max && contentLength > criteria.avgContentLength.max) return false;
      }

      return true;
    });
  }

  calculateAverageSentiment(feedbackData) {
    if (feedbackData.length === 0) return 0;
    
    const sentimentScores = feedbackData.map(f => {
      switch (f.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        case 'neutral': return 0;
        case 'mixed': return 0;
        default: return 0;
      }
    });
    
    return sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length;
  }

  getTopCategories(feedbackData, limit = 5) {
    const allCategories = feedbackData
      .flatMap(f => f.categories || [])
      .filter(Boolean);
    
    const categoryCounts = {};
    allCategories.forEach(cat => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([cat, count]) => ({ category: cat, count }));
  }

  getTopSources(feedbackData, limit = 3) {
    const sourceCounts = {};
    feedbackData.forEach(f => {
      sourceCounts[f.source] = (sourceCounts[f.source] || 0) + 1;
    });
    
    return Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([source, count]) => ({ source, count }));
  }

  getUrgencyDistribution(feedbackData) {
    const urgencyCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    feedbackData.forEach(f => {
      if (f.urgency) {
        urgencyCounts[f.urgency] = (urgencyCounts[f.urgency] || 0) + 1;
      }
    });
    return urgencyCounts;
  }

  // Get available segment types
  getSegmentTypes() {
    return Object.values(this.segmentTypes);
  }

  // Get segment type metadata
  getSegmentTypeMetadata(segmentType) {
    const metadata = {
      [this.segmentTypes.PERSONA]: {
        name: 'User Personas',
        description: 'Group users by their behavior patterns and engagement levels',
        icon: 'users'
      },
      [this.segmentTypes.LIFECYCLE]: {
        name: 'Lifecycle Stages',
        description: 'Segment users by their journey stage in the product',
        icon: 'cycle'
      },
      [this.segmentTypes.PLAN]: {
        name: 'Subscription Plans',
        description: 'Group feedback by user subscription tiers',
        icon: 'credit-card'
      },
      [this.segmentTypes.BEHAVIOR]: {
        name: 'Behavior Patterns',
        description: 'Segment by user interaction and feedback patterns',
        icon: 'activity'
      },
      [this.segmentTypes.GEOGRAPHIC]: {
        name: 'Geographic Location',
        description: 'Group users by their geographic location',
        icon: 'map-pin'
      },
      [this.segmentTypes.TEMPORAL]: {
        name: 'Temporal Patterns',
        description: 'Segment by time-based usage patterns',
        icon: 'clock'
      }
    };

    return metadata[segmentType] || null;
  }
}

module.exports = new SegmentationService(); 