const { Op } = require('sequelize');
const Feedback = require('../models/Feedback');
const { redisClient } = require('../config/database');

class ChurnPredictionService {
  constructor() {
    this.riskLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    
    this.churnFactors = {
      NEGATIVE_SENTIMENT: 'negative_sentiment',
      DECREASING_ENGAGEMENT: 'decreasing_engagement',
      COMPETITOR_MENTIONS: 'competitor_mentions',
      FEATURE_REQUESTS: 'feature_requests',
      SUPPORT_ISSUES: 'support_issues',
      PRICING_CONCERNS: 'pricing_concerns',
      ONBOARDING_PROBLEMS: 'onboarding_problems',
      TECHNICAL_ISSUES: 'technical_issues'
    };
  }

  // Main method to predict churn risk for a user
  async predictChurnRisk(userId, options = {}) {
    try {
      const {
        timeRange = '90d',
        source = 'all',
        includeDetails = true
      } = options;

      // Get user's feedback data
      const feedbackData = await this.gatherUserFeedback(userId, {
        timeRange,
        source
      });

      // Calculate churn risk score
      const riskScore = await this.calculateRiskScore(feedbackData);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(riskScore);
      
      // Identify churn factors
      const churnFactors = await this.identifyChurnFactors(feedbackData);
      
      // Generate predictions
      const predictions = await this.generatePredictions(feedbackData, riskScore);
      
      // Calculate retention probability
      const retentionProbability = this.calculateRetentionProbability(riskScore);

      const result = {
        riskScore,
        riskLevel,
        retentionProbability,
        churnFactors,
        predictions,
        metadata: {
          totalFeedback: feedbackData.length,
          timeRange,
          source,
          analysisDate: new Date()
        }
      };

      // Add detailed analysis if requested
      if (includeDetails) {
        result.details = await this.generateDetailedAnalysis(feedbackData, riskScore);
      }

      return result;
    } catch (error) {
      console.error('Churn prediction error:', error);
      throw error;
    }
  }

  // Gather user feedback data
  async gatherUserFeedback(userId, filters) {
    const { timeRange, source } = filters;
    
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
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '60d':
          startDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      whereClause.createdAt = { [Op.gte]: startDate };
    }

    return await Feedback.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
  }

  // Calculate churn risk score (0-100)
  async calculateRiskScore(feedbackData) {
    if (feedbackData.length === 0) {
      return 50; // Neutral score for no data
    }

    let riskScore = 50; // Start with neutral score
    
    // Factor 1: Sentiment Analysis (30% weight)
    const sentimentScore = this.calculateSentimentRisk(feedbackData);
    riskScore += sentimentScore * 0.3;
    
    // Factor 2: Engagement Patterns (25% weight)
    const engagementScore = this.calculateEngagementRisk(feedbackData);
    riskScore += engagementScore * 0.25;
    
    // Factor 3: Support Issues (20% weight)
    const supportScore = this.calculateSupportRisk(feedbackData);
    riskScore += supportScore * 0.2;
    
    // Factor 4: Feature Requests vs Complaints (15% weight)
    const featureScore = this.calculateFeatureRisk(feedbackData);
    riskScore += featureScore * 0.15;
    
    // Factor 5: Competitor Mentions (10% weight)
    const competitorScore = this.calculateCompetitorRisk(feedbackData);
    riskScore += competitorScore * 0.1;

    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, riskScore));
  }

  // Calculate sentiment-based risk
  calculateSentimentRisk(feedbackData) {
    const negativeFeedback = feedbackData.filter(f => f.sentiment === 'negative');
    const positiveFeedback = feedbackData.filter(f => f.sentiment === 'positive');
    
    const negativeRatio = negativeFeedback.length / feedbackData.length;
    const positiveRatio = positiveFeedback.length / feedbackData.length;
    
    // Higher negative ratio increases risk
    let risk = negativeRatio * 50;
    
    // Recent negative feedback has more weight
    const recentNegative = negativeFeedback.filter(f => {
      const daysAgo = (new Date() - new Date(f.createdAt)) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });
    
    if (recentNegative.length > 0) {
      risk += (recentNegative.length / feedbackData.length) * 30;
    }
    
    return risk;
  }

  // Calculate engagement-based risk
  calculateEngagementRisk(feedbackData) {
    if (feedbackData.length === 0) return 0;
    
    // Check for decreasing engagement over time
    const sortedFeedback = feedbackData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const timeRanges = this.splitIntoTimeRanges(sortedFeedback, 3);
    
    let engagementRisk = 0;
    
    // If engagement is decreasing, increase risk
    if (timeRanges.length >= 2) {
      const recentCount = timeRanges[timeRanges.length - 1].length;
      const previousCount = timeRanges[timeRanges.length - 2].length;
      
      if (recentCount < previousCount) {
        engagementRisk += 20;
      }
      
      if (recentCount === 0 && previousCount > 0) {
        engagementRisk += 40; // No recent engagement
      }
    }
    
    // Check for long gaps in feedback
    const gaps = this.findFeedbackGaps(sortedFeedback);
    if (gaps.some(gap => gap > 30)) { // Gap longer than 30 days
      engagementRisk += 25;
    }
    
    return engagementRisk;
  }

  // Calculate support issues risk
  calculateSupportRisk(feedbackData) {
    const supportKeywords = ['help', 'support', 'issue', 'problem', 'bug', 'error', 'broken', 'not working'];
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately'];
    
    let supportRisk = 0;
    
    feedbackData.forEach(feedback => {
      const content = feedback.content.toLowerCase();
      
      // Check for support-related keywords
      const supportMatches = supportKeywords.filter(keyword => content.includes(keyword));
      if (supportMatches.length > 0) {
        supportRisk += 10;
      }
      
      // Check for urgent keywords
      const urgentMatches = urgentKeywords.filter(keyword => content.includes(keyword));
      if (urgentMatches.length > 0) {
        supportRisk += 20;
      }
      
      // High urgency feedback
      if (feedback.urgency === 'high' || feedback.urgency === 'critical') {
        supportRisk += 15;
      }
    });
    
    return Math.min(50, supportRisk);
  }

  // Calculate feature request vs complaint risk
  calculateFeatureRisk(feedbackData) {
    const featureRequests = feedbackData.filter(f => 
      f.categories && f.categories.includes('feature_request')
    );
    
    const complaints = feedbackData.filter(f => 
      f.categories && (f.categories.includes('complaint') || f.categories.includes('bug_report'))
    );
    
    const featureRatio = featureRequests.length / feedbackData.length;
    const complaintRatio = complaints.length / feedbackData.length;
    
    let risk = 0;
    
    // High complaint ratio increases risk
    if (complaintRatio > 0.3) {
      risk += 30;
    }
    
    // Many feature requests might indicate dissatisfaction
    if (featureRatio > 0.5) {
      risk += 15;
    }
    
    // Unresolved complaints
    const unresolvedComplaints = complaints.filter(f => !f.isResolved);
    if (unresolvedComplaints.length > 0) {
      risk += unresolvedComplaints.length * 10;
    }
    
    return Math.min(50, risk);
  }

  // Calculate competitor mention risk
  calculateCompetitorRisk(feedbackData) {
    const competitorKeywords = [
      'competitor', 'alternative', 'better', 'switch', 'migration',
      'other tool', 'different platform', 'considering', 'evaluating'
    ];
    
    let competitorRisk = 0;
    
    feedbackData.forEach(feedback => {
      const content = feedback.content.toLowerCase();
      
      const matches = competitorKeywords.filter(keyword => content.includes(keyword));
      if (matches.length > 0) {
        competitorRisk += matches.length * 15;
      }
    });
    
    return Math.min(50, competitorRisk);
  }

  // Determine risk level based on score
  determineRiskLevel(riskScore) {
    if (riskScore >= 80) return this.riskLevels.CRITICAL;
    if (riskScore >= 60) return this.riskLevels.HIGH;
    if (riskScore >= 40) return this.riskLevels.MEDIUM;
    return this.riskLevels.LOW;
  }

  // Identify specific churn factors
  async identifyChurnFactors(feedbackData) {
    const factors = [];
    
    // Check for negative sentiment trend
    const recentFeedback = feedbackData.filter(f => {
      const daysAgo = (new Date() - new Date(f.createdAt)) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });
    
    const recentNegative = recentFeedback.filter(f => f.sentiment === 'negative');
    if (recentNegative.length > 0) {
      factors.push({
        type: this.churnFactors.NEGATIVE_SENTIMENT,
        severity: 'high',
        description: `${recentNegative.length} negative feedback items in the last 30 days`,
        count: recentNegative.length
      });
    }
    
    // Check for decreasing engagement
    const engagementGaps = this.findFeedbackGaps(feedbackData);
    if (engagementGaps.some(gap => gap > 30)) {
      factors.push({
        type: this.churnFactors.DECREASING_ENGAGEMENT,
        severity: 'medium',
        description: 'Long periods without feedback activity',
        gaps: engagementGaps.filter(gap => gap > 30)
      });
    }
    
    // Check for competitor mentions
    const competitorMentions = feedbackData.filter(f => {
      const content = f.content.toLowerCase();
      return content.includes('competitor') || content.includes('alternative');
    });
    
    if (competitorMentions.length > 0) {
      factors.push({
        type: this.churnFactors.COMPETITOR_MENTIONS,
        severity: 'high',
        description: `${competitorMentions.length} mentions of competitors or alternatives`,
        count: competitorMentions.length
      });
    }
    
    // Check for unresolved support issues
    const unresolvedIssues = feedbackData.filter(f => 
      (f.urgency === 'high' || f.urgency === 'critical') && !f.isResolved
    );
    
    if (unresolvedIssues.length > 0) {
      factors.push({
        type: this.churnFactors.SUPPORT_ISSUES,
        severity: 'critical',
        description: `${unresolvedIssues.length} unresolved high-priority issues`,
        count: unresolvedIssues.length
      });
    }
    
    return factors;
  }

  // Generate churn predictions
  async generatePredictions(feedbackData, riskScore) {
    const predictions = [];
    
    // Predict churn timeline
    if (riskScore >= 80) {
      predictions.push({
        type: 'timeline',
        prediction: 'High risk of churn within 30 days',
        confidence: 'high',
        timeframe: '30 days'
      });
    } else if (riskScore >= 60) {
      predictions.push({
        type: 'timeline',
        prediction: 'Moderate risk of churn within 60 days',
        confidence: 'medium',
        timeframe: '60 days'
      });
    } else if (riskScore >= 40) {
      predictions.push({
        type: 'timeline',
        prediction: 'Low risk of churn within 90 days',
        confidence: 'low',
        timeframe: '90 days'
      });
    }
    
    // Predict retention actions needed
    if (riskScore >= 60) {
      predictions.push({
        type: 'action',
        prediction: 'Immediate intervention required',
        actions: ['Personal outreach', 'Feature prioritization', 'Support escalation'],
        priority: 'high'
      });
    } else if (riskScore >= 40) {
      predictions.push({
        type: 'action',
        prediction: 'Proactive engagement recommended',
        actions: ['Regular check-ins', 'Feature updates', 'Success stories'],
        priority: 'medium'
      });
    }
    
    return predictions;
  }

  // Calculate retention probability
  calculateRetentionProbability(riskScore) {
    // Convert risk score to retention probability (inverse relationship)
    const baseProbability = 100 - riskScore;
    
    // Apply confidence adjustments
    let probability = baseProbability;
    
    if (riskScore >= 80) {
      probability *= 0.8; // Lower confidence for very high risk
    } else if (riskScore <= 20) {
      probability *= 1.2; // Higher confidence for very low risk
    }
    
    return Math.max(0, Math.min(100, probability));
  }

  // Generate detailed analysis
  async generateDetailedAnalysis(feedbackData, riskScore) {
    const analysis = {
      sentimentTrend: this.analyzeSentimentTrend(feedbackData),
      engagementPattern: this.analyzeEngagementPattern(feedbackData),
      supportHistory: this.analyzeSupportHistory(feedbackData),
      featureRequests: this.analyzeFeatureRequests(feedbackData),
      recommendations: this.generateRecommendations(riskScore)
    };
    
    return analysis;
  }

  // Helper methods
  splitIntoTimeRanges(feedbackData, numRanges) {
    if (feedbackData.length === 0) return [];
    
    const sortedFeedback = feedbackData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const totalDays = (new Date(sortedFeedback[sortedFeedback.length - 1].createdAt) - new Date(sortedFeedback[0].createdAt)) / (1000 * 60 * 60 * 24);
    const daysPerRange = totalDays / numRanges;
    
    const ranges = [];
    for (let i = 0; i < numRanges; i++) {
      const startDate = new Date(sortedFeedback[0].createdAt.getTime() + (i * daysPerRange * 24 * 60 * 60 * 1000));
      const endDate = new Date(startDate.getTime() + (daysPerRange * 24 * 60 * 60 * 1000));
      
      const rangeFeedback = sortedFeedback.filter(f => {
        const feedbackDate = new Date(f.createdAt);
        return feedbackDate >= startDate && feedbackDate < endDate;
      });
      
      ranges.push(rangeFeedback);
    }
    
    return ranges;
  }

  findFeedbackGaps(feedbackData) {
    if (feedbackData.length < 2) return [];
    
    const sortedFeedback = feedbackData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const gaps = [];
    
    for (let i = 1; i < sortedFeedback.length; i++) {
      const gap = (new Date(sortedFeedback[i].createdAt) - new Date(sortedFeedback[i-1].createdAt)) / (1000 * 60 * 60 * 24);
      gaps.push(gap);
    }
    
    return gaps;
  }

  analyzeSentimentTrend(feedbackData) {
    const timeRanges = this.splitIntoTimeRanges(feedbackData, 3);
    const trends = timeRanges.map(range => {
      const negativeCount = range.filter(f => f.sentiment === 'negative').length;
      const positiveCount = range.filter(f => f.sentiment === 'positive').length;
      return {
        negativeRatio: range.length > 0 ? negativeCount / range.length : 0,
        positiveRatio: range.length > 0 ? positiveCount / range.length : 0
      };
    });
    
    return {
      trends,
      isImproving: trends.length >= 2 && trends[trends.length - 1].negativeRatio < trends[0].negativeRatio,
      isDeclining: trends.length >= 2 && trends[trends.length - 1].negativeRatio > trends[0].negativeRatio
    };
  }

  analyzeEngagementPattern(feedbackData) {
    const gaps = this.findFeedbackGaps(feedbackData);
    const averageGap = gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
    
    return {
      totalFeedback: feedbackData.length,
      averageGap,
      hasLongGaps: gaps.some(gap => gap > 30),
      recentActivity: feedbackData.some(f => {
        const daysAgo = (new Date() - new Date(f.createdAt)) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      })
    };
  }

  analyzeSupportHistory(feedbackData) {
    const supportIssues = feedbackData.filter(f => 
      f.urgency === 'high' || f.urgency === 'critical'
    );
    
    const unresolvedIssues = supportIssues.filter(f => !f.isResolved);
    
    return {
      totalIssues: supportIssues.length,
      unresolvedIssues: unresolvedIssues.length,
      resolutionRate: supportIssues.length > 0 ? (supportIssues.length - unresolvedIssues.length) / supportIssues.length : 1
    };
  }

  analyzeFeatureRequests(feedbackData) {
    const featureRequests = feedbackData.filter(f => 
      f.categories && f.categories.includes('feature_request')
    );
    
    const complaints = feedbackData.filter(f => 
      f.categories && (f.categories.includes('complaint') || f.categories.includes('bug_report'))
    );
    
    return {
      featureRequests: featureRequests.length,
      complaints: complaints.length,
      ratio: feedbackData.length > 0 ? featureRequests.length / feedbackData.length : 0
    };
  }

  generateRecommendations(riskScore) {
    const recommendations = [];
    
    if (riskScore >= 80) {
      recommendations.push({
        priority: 'critical',
        action: 'Immediate personal outreach',
        description: 'Schedule a call with the customer to understand their concerns'
      });
      recommendations.push({
        priority: 'high',
        action: 'Escalate support issues',
        description: 'Prioritize resolution of any open high-priority support tickets'
      });
    } else if (riskScore >= 60) {
      recommendations.push({
        priority: 'high',
        action: 'Proactive engagement',
        description: 'Send personalized updates about requested features or improvements'
      });
      recommendations.push({
        priority: 'medium',
        action: 'Success story sharing',
        description: 'Share relevant customer success stories and use cases'
      });
    } else if (riskScore >= 40) {
      recommendations.push({
        priority: 'medium',
        action: 'Regular check-ins',
        description: 'Schedule periodic check-ins to maintain engagement'
      });
    } else {
      recommendations.push({
        priority: 'low',
        action: 'Maintain current engagement',
        description: 'Continue with current engagement strategy'
      });
    }
    
    return recommendations;
  }

  // Get risk level metadata
  getRiskLevelMetadata(riskLevel) {
    const metadata = {
      [this.riskLevels.LOW]: {
        name: 'Low Risk',
        description: 'Customer shows healthy engagement patterns',
        color: 'green',
        icon: 'check-circle'
      },
      [this.riskLevels.MEDIUM]: {
        name: 'Medium Risk',
        description: 'Some concerning patterns detected',
        color: 'yellow',
        icon: 'alert-circle'
      },
      [this.riskLevels.HIGH]: {
        name: 'High Risk',
        description: 'Multiple churn indicators detected',
        color: 'orange',
        icon: 'alert-triangle'
      },
      [this.riskLevels.CRITICAL]: {
        name: 'Critical Risk',
        description: 'Immediate intervention required',
        color: 'red',
        icon: 'x-circle'
      }
    };
    
    return metadata[riskLevel] || metadata[this.riskLevels.MEDIUM];
  }
}

module.exports = new ChurnPredictionService(); 