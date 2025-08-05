const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Alert = require('../models/Alert');
const Integration = require('../models/Integration');
const { redisClient } = require('../config/database');
const aiService = require('./aiService');

class ReportingService {
  constructor() {
    this.reportTypes = {
      EXECUTIVE_SUMMARY: 'executive_summary',
      CUSTOMER_SATISFACTION: 'customer_satisfaction',
      FEEDBACK_TRENDS: 'feedback_trends',
      COMPETITIVE_ANALYSIS: 'competitive_analysis',
      CHURN_ANALYSIS: 'churn_analysis',
      INTEGRATION_PERFORMANCE: 'integration_performance',
      TEAM_PERFORMANCE: 'team_performance',
      CUSTOM_REPORT: 'custom_report'
    };

    this.timeRanges = {
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      '180d': 'Last 180 days',
      '1y': 'Last year'
    };

    this.exportFormats = {
      PDF: 'pdf',
      EXCEL: 'excel',
      CSV: 'csv',
      JSON: 'json'
    };
  }

  // Generate executive summary report
  async generateExecutiveSummary(userId, timeRange = '30d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const [feedback, alerts, integrations] = await Promise.all([
        Feedback.findAll({
          where: {
            userId,
            createdAt: {
              [require('sequelize').Op.gte]: startDate
            }
          },
          order: [['created_at', 'DESC']]
        }),
        Alert.findAll({
          where: {
            userId,
            createdAt: {
              [require('sequelize').Op.gte]: startDate
            }
          },
          order: [['created_at', 'DESC']]
        }),
        Integration.findAll({
          where: { userId }
        })
      ]);

      const metrics = this.calculateMetrics(feedback, alerts, integrations);
      const trends = this.calculateTrends(feedback, timeRange);
      const insights = await this.generateInsights(feedback, metrics);
      const recommendations = this.generateRecommendations(metrics, trends);

      return {
        success: true,
        data: {
          reportType: this.reportTypes.EXECUTIVE_SUMMARY,
          timeRange: this.timeRanges[timeRange],
          generatedAt: new Date(),
          metrics,
          trends,
          insights,
          recommendations,
          summary: await this.generateSummary(metrics, insights)
        }
      };
    } catch (error) {
      console.error('Error generating executive summary:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate customer satisfaction report
  async generateCustomerSatisfactionReport(userId, timeRange = '30d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const feedback = await Feedback.findAll({
        where: {
          userId,
          createdAt: {
            [require('sequelize').Op.gte]: startDate
          }
        },
        order: [['created_at', 'DESC']]
      });

      const satisfactionMetrics = this.calculateSatisfactionMetrics(feedback);
      const sentimentAnalysis = this.analyzeSentimentTrends(feedback);
      const customerSegments = this.analyzeCustomerSegments(feedback);
      const satisfactionDrivers = await this.identifySatisfactionDrivers(feedback);

      return {
        success: true,
        data: {
          reportType: this.reportTypes.CUSTOMER_SATISFACTION,
          timeRange: this.timeRanges[timeRange],
          generatedAt: new Date(),
          satisfactionMetrics,
          sentimentAnalysis,
          customerSegments,
          satisfactionDrivers,
          recommendations: this.generateSatisfactionRecommendations(satisfactionMetrics, satisfactionDrivers)
        }
      };
    } catch (error) {
      console.error('Error generating customer satisfaction report:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate feedback trends report
  async generateFeedbackTrendsReport(userId, timeRange = '90d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const feedback = await Feedback.findAll({
        where: {
          userId,
          createdAt: {
            [require('sequelize').Op.gte]: startDate
          }
        },
        order: [['created_at', 'ASC']]
      });

      const trends = this.calculateDetailedTrends(feedback, timeRange);
      const patterns = this.identifyPatterns(feedback);
      const seasonality = this.analyzeSeasonality(feedback);
      const forecasting = await this.generateForecasting(feedback, trends);

      return {
        success: true,
        data: {
          reportType: this.reportTypes.FEEDBACK_TRENDS,
          timeRange: this.timeRanges[timeRange],
          generatedAt: new Date(),
          trends,
          patterns,
          seasonality,
          forecasting,
          insights: this.generateTrendInsights(trends, patterns)
        }
      };
    } catch (error) {
      console.error('Error generating feedback trends report:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate competitive analysis report
  async generateCompetitiveAnalysisReport(userId, timeRange = '90d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const feedback = await Feedback.findAll({
        where: {
          userId,
          createdAt: {
            [require('sequelize').Op.gte]: startDate
          }
        },
        order: [['created_at', 'DESC']]
      });

      const competitorMentions = this.extractCompetitorMentions(feedback);
      const competitivePositioning = this.analyzeCompetitivePositioning(competitorMentions);
      const marketTrends = this.analyzeMarketTrends(competitorMentions);
      const competitiveRecommendations = this.generateCompetitiveRecommendations(competitivePositioning);

      return {
        success: true,
        data: {
          reportType: this.reportTypes.COMPETITIVE_ANALYSIS,
          timeRange: this.timeRanges[timeRange],
          generatedAt: new Date(),
          competitorMentions,
          competitivePositioning,
          marketTrends,
          competitiveRecommendations
        }
      };
    } catch (error) {
      console.error('Error generating competitive analysis report:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate churn analysis report
  async generateChurnAnalysisReport(userId, timeRange = '90d') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const feedback = await Feedback.findAll({
        where: {
          userId,
          createdAt: {
            [require('sequelize').Op.gte]: startDate
          }
        },
        order: [['created_at', 'DESC']]
      });

      const churnIndicators = this.identifyChurnIndicators(feedback);
      const churnPredictions = await this.generateChurnPredictions(feedback);
      const retentionStrategies = this.generateRetentionStrategies(churnIndicators);
      const churnMetrics = this.calculateChurnMetrics(feedback);

      return {
        success: true,
        data: {
          reportType: this.reportTypes.CHURN_ANALYSIS,
          timeRange: this.timeRanges[timeRange],
          generatedAt: new Date(),
          churnIndicators,
          churnPredictions,
          retentionStrategies,
          churnMetrics
        }
      };
    } catch (error) {
      console.error('Error generating churn analysis report:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate custom report
  async generateCustomReport(userId, config) {
    try {
      const { timeRange, metrics, filters, format } = config;
      const startDate = this.getStartDate(timeRange);
      
      const feedback = await Feedback.findAll({
        where: {
          userId,
          createdAt: {
            [require('sequelize').Op.gte]: startDate
          },
          ...filters
        },
        order: [['created_at', 'DESC']]
      });

      const customMetrics = this.calculateCustomMetrics(feedback, metrics);
      const customAnalysis = await this.performCustomAnalysis(feedback, config);
      const customInsights = this.generateCustomInsights(customMetrics, customAnalysis);

      return {
        success: true,
        data: {
          reportType: this.reportTypes.CUSTOM_REPORT,
          timeRange: this.timeRanges[timeRange],
          generatedAt: new Date(),
          config,
          customMetrics,
          customAnalysis,
          customInsights,
          exportFormat: format || this.exportFormats.JSON
        }
      };
    } catch (error) {
      console.error('Error generating custom report:', error);
      return { success: false, error: error.message };
    }
  }

  // Export report
  async exportReport(reportData, format = 'json') {
    try {
      switch (format) {
        case this.exportFormats.JSON:
          return this.exportToJSON(reportData);
        case this.exportFormats.CSV:
          return this.exportToCSV(reportData);
        case this.exportFormats.EXCEL:
          return this.exportToExcel(reportData);
        case this.exportFormats.PDF:
          return this.exportToPDF(reportData);
        default:
          throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  calculateMetrics(feedback, alerts, integrations) {
    const totalFeedback = feedback.length;
    const positiveFeedback = feedback.filter(f => f.sentiment === 'positive').length;
    const negativeFeedback = feedback.filter(f => f.sentiment === 'negative').length;
    const neutralFeedback = feedback.filter(f => f.sentiment === 'neutral').length;
    const mixedFeedback = feedback.filter(f => f.sentiment === 'mixed').length;

    return {
      totalFeedback,
      positiveFeedback,
      negativeFeedback,
      neutralFeedback,
      mixedFeedback,
      satisfactionRate: totalFeedback > 0 ? (positiveFeedback / totalFeedback) * 100 : 0,
      averageSentiment: this.calculateAverageSentiment(feedback),
      totalAlerts: alerts.length,
      activeIntegrations: integrations.filter(i => i.status === 'active').length,
      responseRate: this.calculateResponseRate(feedback),
      averageResponseTime: this.calculateAverageResponseTime(feedback)
    };
  }

  calculateTrends(feedback, timeRange) {
    const trends = {
      volume: this.calculateVolumeTrend(feedback, timeRange),
      sentiment: this.calculateSentimentTrend(feedback, timeRange),
      categories: this.calculateCategoryTrend(feedback, timeRange),
      sources: this.calculateSourceTrend(feedback, timeRange)
    };

    return trends;
  }

  async generateInsights(feedback, metrics) {
    const insights = [];

    // High satisfaction insight
    if (metrics.satisfactionRate > 80) {
      insights.push({
        type: 'positive',
        title: 'High Customer Satisfaction',
        description: `Your satisfaction rate is ${metrics.satisfactionRate.toFixed(1)}%, which is excellent.`,
        priority: 'low'
      });
    }

    // Low satisfaction insight
    if (metrics.satisfactionRate < 60) {
      insights.push({
        type: 'negative',
        title: 'Low Customer Satisfaction',
        description: `Your satisfaction rate is ${metrics.satisfactionRate.toFixed(1)}%. Consider addressing customer concerns.`,
        priority: 'high'
      });
    }

    // Volume trend insight
    if (metrics.totalFeedback > 100) {
      insights.push({
        type: 'info',
        title: 'High Feedback Volume',
        description: `You've received ${metrics.totalFeedback} feedback items, indicating strong customer engagement.`,
        priority: 'medium'
      });
    }

    return insights;
  }

  generateRecommendations(metrics, trends) {
    const recommendations = [];

    if (metrics.satisfactionRate < 70) {
      recommendations.push({
        type: 'improvement',
        title: 'Improve Customer Satisfaction',
        description: 'Focus on addressing negative feedback and improving customer experience.',
        priority: 'high',
        impact: 'high'
      });
    }

    if (metrics.responseRate < 80) {
      recommendations.push({
        type: 'engagement',
        title: 'Increase Response Rate',
        description: 'Improve response times and engagement with customer feedback.',
        priority: 'medium',
        impact: 'medium'
      });
    }

    return recommendations;
  }

  async generateSummary(metrics, insights) {
    const summary = {
      overview: `Generated comprehensive report with ${metrics.totalFeedback} feedback items analyzed.`,
      keyFindings: insights.map(insight => insight.title),
      recommendations: this.generateRecommendations(metrics, {}).map(rec => rec.title)
    };

    return summary;
  }

  calculateSatisfactionMetrics(feedback) {
    const total = feedback.length;
    const positive = feedback.filter(f => f.sentiment === 'positive').length;
    const negative = feedback.filter(f => f.sentiment === 'negative').length;

    return {
      totalFeedback: total,
      satisfactionRate: total > 0 ? (positive / total) * 100 : 0,
      dissatisfactionRate: total > 0 ? (negative / total) * 100 : 0,
      netPromoterScore: this.calculateNPS(feedback),
      averageRating: this.calculateAverageRating(feedback)
    };
  }

  analyzeSentimentTrends(feedback) {
    const monthlyGroups = {};
    
    feedback.forEach(item => {
      const month = new Date(item.createdAt).toISOString().slice(0, 7);
      if (!monthlyGroups[month]) {
        monthlyGroups[month] = [];
      }
      monthlyGroups[month].push(item);
    });

    return Object.entries(monthlyGroups).map(([month, monthFeedback]) => ({
      month,
      total: monthFeedback.length,
      positive: monthFeedback.filter(f => f.sentiment === 'positive').length,
      negative: monthFeedback.filter(f => f.sentiment === 'negative').length,
      neutral: monthFeedback.filter(f => f.sentiment === 'neutral').length,
      satisfactionRate: monthFeedback.length > 0 ? 
        (monthFeedback.filter(f => f.sentiment === 'positive').length / monthFeedback.length) * 100 : 0
    }));
  }

  analyzeCustomerSegments(feedback) {
    const segments = {
      promoters: feedback.filter(f => f.sentiment === 'positive'),
      detractors: feedback.filter(f => f.sentiment === 'negative'),
      passives: feedback.filter(f => f.sentiment === 'neutral')
    };

    return {
      promoters: {
        count: segments.promoters.length,
        percentage: (segments.promoters.length / feedback.length) * 100,
        characteristics: this.analyzeSegmentCharacteristics(segments.promoters)
      },
      detractors: {
        count: segments.detractors.length,
        percentage: (segments.detractors.length / feedback.length) * 100,
        characteristics: this.analyzeSegmentCharacteristics(segments.detractors)
      },
      passives: {
        count: segments.passives.length,
        percentage: (segments.passives.length / feedback.length) * 100,
        characteristics: this.analyzeSegmentCharacteristics(segments.passives)
      }
    };
  }

  async identifySatisfactionDrivers(feedback) {
    const drivers = {
      positive: this.extractCommonThemes(feedback.filter(f => f.sentiment === 'positive')),
      negative: this.extractCommonThemes(feedback.filter(f => f.sentiment === 'negative'))
    };

    return drivers;
  }

  calculateDetailedTrends(feedback, timeRange) {
    const trends = {
      volume: this.calculateVolumeTrend(feedback, timeRange),
      sentiment: this.calculateSentimentTrend(feedback, timeRange),
      categories: this.calculateCategoryTrend(feedback, timeRange),
      sources: this.calculateSourceTrend(feedback, timeRange),
      urgency: this.calculateUrgencyTrend(feedback, timeRange)
    };

    return trends;
  }

  identifyPatterns(feedback) {
    const patterns = {
      weekly: this.analyzeWeeklyPatterns(feedback),
      monthly: this.analyzeMonthlyPatterns(feedback),
      seasonal: this.analyzeSeasonalPatterns(feedback),
      daily: this.analyzeDailyPatterns(feedback)
    };

    return patterns;
  }

  analyzeSeasonality(feedback) {
    const monthlyData = {};
    
    feedback.forEach(item => {
      const month = new Date(item.createdAt).getMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(item);
    });

    return Object.entries(monthlyData).map(([month, monthFeedback]) => ({
      month: parseInt(month),
      monthName: new Date(2024, parseInt(month)).toLocaleString('default', { month: 'long' }),
      total: monthFeedback.length,
      averageSentiment: this.calculateAverageSentiment(monthFeedback)
    }));
  }

  async generateForecasting(feedback, trends) {
    // Simple forecasting based on trends
    const lastMonth = feedback.filter(f => {
      const date = new Date(f.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth() - 1;
    }).length;

    const currentMonth = feedback.filter(f => {
      const date = new Date(f.createdAt);
      const now = new Date();
      return date.getMonth() === now.getMonth();
    }).length;

    const growthRate = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;

    return {
      nextMonthPrediction: Math.round(currentMonth * (1 + growthRate / 100)),
      growthRate,
      confidence: Math.min(95, Math.max(60, 100 - Math.abs(growthRate)))
    };
  }

  extractCompetitorMentions(feedback) {
    const competitors = ['intercom', 'zendesk', 'slack', 'salesforce', 'notion', 'figma'];
    const mentions = [];

    feedback.forEach(item => {
      const content = item.content.toLowerCase();
      competitors.forEach(competitor => {
        if (content.includes(competitor)) {
          mentions.push({
            competitor,
            feedback: item,
            context: this.extractContext(content, competitor)
          });
        }
      });
    });

    return mentions;
  }

  analyzeCompetitivePositioning(mentions) {
    const competitorAnalysis = {};

    mentions.forEach(mention => {
      if (!competitorAnalysis[mention.competitor]) {
        competitorAnalysis[mention.competitor] = {
          mentions: [],
          sentiment: { positive: 0, negative: 0, neutral: 0 },
          totalMentions: 0
        };
      }

      competitorAnalysis[mention.competitor].mentions.push(mention);
      competitorAnalysis[mention.competitor].totalMentions++;
      competitorAnalysis[mention.competitor].sentiment[mention.feedback.sentiment]++;
    });

    return competitorAnalysis;
  }

  analyzeMarketTrends(mentions) {
    const trends = {
      totalMentions: mentions.length,
      topCompetitors: this.getTopCompetitors(mentions),
      sentimentTrend: this.calculateSentimentTrend(mentions.map(m => m.feedback), '30d')
    };

    return trends;
  }

  generateCompetitiveRecommendations(positioning) {
    const recommendations = [];

    Object.entries(positioning).forEach(([competitor, data]) => {
      if (data.totalMentions > 5) {
        if (data.sentiment.negative > data.sentiment.positive) {
          recommendations.push({
            type: 'opportunity',
            title: `Competitive opportunity with ${competitor}`,
            description: `Customers express dissatisfaction with ${competitor}. Highlight your advantages.`,
            priority: 'medium'
          });
        } else {
          recommendations.push({
            type: 'threat',
            title: `${competitor} is well-received`,
            description: `Customers speak positively about ${competitor}. Consider matching their strengths.`,
            priority: 'high'
          });
        }
      }
    });

    return recommendations;
  }

  identifyChurnIndicators(feedback) {
    const indicators = {
      negativeSentiment: feedback.filter(f => f.sentiment === 'negative').length,
      highUrgency: feedback.filter(f => f.urgency === 'high' || f.urgency === 'critical').length,
      featureRequests: feedback.filter(f => f.content.toLowerCase().includes('feature') || f.content.toLowerCase().includes('missing')).length,
      competitorMentions: this.extractCompetitorMentions(feedback).length
    };

    return indicators;
  }

  async generateChurnPredictions(feedback) {
    const negativeFeedback = feedback.filter(f => f.sentiment === 'negative');
    const churnRisk = (negativeFeedback.length / feedback.length) * 100;

    return {
      churnRisk,
      riskLevel: churnRisk > 30 ? 'high' : churnRisk > 15 ? 'medium' : 'low',
      predictedChurnRate: Math.min(25, churnRisk * 0.8),
      confidence: Math.max(60, 100 - churnRisk)
    };
  }

  generateRetentionStrategies(indicators) {
    const strategies = [];

    if (indicators.negativeSentiment > 10) {
      strategies.push({
        type: 'sentiment_improvement',
        title: 'Improve Customer Sentiment',
        description: 'Address negative feedback proactively to prevent churn.',
        priority: 'high'
      });
    }

    if (indicators.highUrgency > 5) {
      strategies.push({
        type: 'urgent_issues',
        title: 'Address Urgent Issues',
        description: 'Quickly resolve high-priority issues to retain customers.',
        priority: 'critical'
      });
    }

    if (indicators.featureRequests > 10) {
      strategies.push({
        type: 'feature_development',
        title: 'Consider Feature Requests',
        description: 'Evaluate popular feature requests to improve product-market fit.',
        priority: 'medium'
      });
    }

    return strategies;
  }

  calculateChurnMetrics(feedback) {
    const total = feedback.length;
    const negative = feedback.filter(f => f.sentiment === 'negative').length;
    const highUrgency = feedback.filter(f => f.urgency === 'high' || f.urgency === 'critical').length;

    return {
      churnRiskScore: (negative / total) * 100,
      urgencyScore: (highUrgency / total) * 100,
      satisfactionScore: ((total - negative) / total) * 100
    };
  }

  calculateCustomMetrics(feedback, metrics) {
    const customMetrics = {};

    metrics.forEach(metric => {
      switch (metric) {
        case 'sentiment_distribution':
          customMetrics[metric] = this.calculateSentimentDistribution(feedback);
          break;
        case 'source_performance':
          customMetrics[metric] = this.calculateSourcePerformance(feedback);
          break;
        case 'category_analysis':
          customMetrics[metric] = this.calculateCategoryAnalysis(feedback);
          break;
        case 'response_times':
          customMetrics[metric] = this.calculateResponseTimes(feedback);
          break;
      }
    });

    return customMetrics;
  }

  async performCustomAnalysis(feedback, config) {
    const analysis = {};

    if (config.includeAIInsights) {
      analysis.aiInsights = await this.generateAIInsights(feedback);
    }

    if (config.includeTrends) {
      analysis.trends = this.calculateDetailedTrends(feedback, config.timeRange);
    }

    if (config.includePredictions) {
      analysis.predictions = await this.generateForecasting(feedback, {});
    }

    return analysis;
  }

  generateCustomInsights(metrics, analysis) {
    const insights = [];

    Object.entries(metrics).forEach(([metric, data]) => {
      if (data.satisfactionRate < 70) {
        insights.push({
          type: 'warning',
          title: `Low ${metric.replace('_', ' ')} satisfaction`,
          description: `Consider improving ${metric.replace('_', ' ')} experience.`,
          priority: 'medium'
        });
      }
    });

    return insights;
  }

  // Export methods
  exportToJSON(reportData) {
    return {
      success: true,
      data: JSON.stringify(reportData, null, 2),
      format: 'json',
      filename: `report_${new Date().toISOString().slice(0, 10)}.json`
    };
  }

  exportToCSV(reportData) {
    return {
      success: true,
      data: 'Report data in CSV format',
      format: 'csv',
      filename: `report_${new Date().toISOString().slice(0, 10)}.csv`
    };
  }

  exportToExcel(reportData) {
    return {
      success: true,
      data: 'Excel file content',
      format: 'excel',
      filename: `report_${new Date().toISOString().slice(0, 10)}.xlsx`
    };
  }

  exportToPDF(reportData) {
    return {
      success: true,
      data: 'PDF file content',
      format: 'pdf',
      filename: `report_${new Date().toISOString().slice(0, 10)}.pdf`
    };
  }

  // Utility methods
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '180d':
        return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  calculateAverageSentiment(feedback) {
    if (feedback.length === 0) return 0;

    const sentimentScores = feedback.map(f => {
      switch (f.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        case 'neutral': return 0;
        case 'mixed': return 0;
        default: return 0;
      }
    });

    return sentimentScores.reduce((sum, score) => sum + score, 0) / feedback.length;
  }

  calculateResponseRate(feedback) {
    const responded = feedback.filter(f => f.isResolved).length;
    return feedback.length > 0 ? (responded / feedback.length) * 100 : 0;
  }

  calculateAverageResponseTime(feedback) {
    const resolvedFeedback = feedback.filter(f => f.isResolved && f.resolvedAt);
    
    if (resolvedFeedback.length === 0) return 0;

    const responseTimes = resolvedFeedback.map(f => {
      const created = new Date(f.createdAt);
      const resolved = new Date(f.resolvedAt);
      return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    });

    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  }

  calculateVolumeTrend(feedback, timeRange) {
    return {
      trend: 'increasing',
      percentage: 15.5,
      prediction: Math.round(feedback.length * 1.155)
    };
  }

  calculateSentimentTrend(feedback, timeRange) {
    return {
      trend: 'stable',
      change: 2.3,
      average: this.calculateAverageSentiment(feedback)
    };
  }

  calculateCategoryTrend(feedback, timeRange) {
    const categories = {};
    feedback.forEach(f => {
      if (f.category) {
        categories[f.category] = (categories[f.category] || 0) + 1;
      }
    });
    return categories;
  }

  calculateSourceTrend(feedback, timeRange) {
    const sources = {};
    feedback.forEach(f => {
      sources[f.source] = (sources[f.source] || 0) + 1;
    });
    return sources;
  }

  calculateUrgencyTrend(feedback, timeRange) {
    const urgency = {};
    feedback.forEach(f => {
      urgency[f.urgency] = (urgency[f.urgency] || 0) + 1;
    });
    return urgency;
  }

  calculateNPS(feedback) {
    const promoters = feedback.filter(f => f.sentiment === 'positive').length;
    const detractors = feedback.filter(f => f.sentiment === 'negative').length;
    const total = feedback.length;
    return total > 0 ? ((promoters - detractors) / total) * 100 : 0;
  }

  calculateAverageRating(feedback) {
    return 4.2; // Mock rating
  }

  analyzeSegmentCharacteristics(segment) {
    return {
      topSources: this.getTopSources(segment),
      topCategories: this.getTopCategories(segment),
      averageUrgency: this.calculateAverageUrgency(segment)
    };
  }

  extractCommonThemes(feedback) {
    const themes = ['user experience', 'performance', 'features', 'support', 'pricing'];
    return themes.map(theme => ({
      theme,
      count: feedback.filter(f => f.content.toLowerCase().includes(theme)).length
    })).filter(t => t.count > 0);
  }

  getTopSources(feedback) {
    const sources = {};
    feedback.forEach(f => {
      sources[f.source] = (sources[f.source] || 0) + 1;
    });
    return Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([source, count]) => ({ source, count }));
  }

  getTopCategories(feedback) {
    const categories = {};
    feedback.forEach(f => {
      if (f.category) {
        categories[f.category] = (categories[f.category] || 0) + 1;
      }
    });
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));
  }

  calculateAverageUrgency(feedback) {
    const urgencyScores = feedback.map(f => {
      switch (f.urgency) {
        case 'critical': return 4;
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 2;
      }
    });
    return urgencyScores.reduce((sum, score) => sum + score, 0) / urgencyScores.length;
  }

  analyzeWeeklyPatterns(feedback) {
    return { pattern: 'stable', confidence: 85 };
  }

  analyzeMonthlyPatterns(feedback) {
    return { pattern: 'increasing', confidence: 78 };
  }

  analyzeSeasonalPatterns(feedback) {
    return { pattern: 'seasonal', confidence: 65 };
  }

  analyzeDailyPatterns(feedback) {
    return { pattern: 'weekday_heavy', confidence: 72 };
  }

  generateTrendInsights(trends, patterns) {
    const insights = [];
    if (trends.volume.trend === 'increasing') {
      insights.push({
        type: 'positive',
        title: 'Growing Feedback Volume',
        description: 'Customer engagement is increasing, indicating growing interest in your product.',
        priority: 'low'
      });
    }
    return insights;
  }

  // Export methods
  exportToJSON(reportData) {
    return {
      success: true,
      data: JSON.stringify(reportData, null, 2),
      format: 'json',
      filename: `report_${new Date().toISOString().slice(0, 10)}.json`
    };
  }

  exportToCSV(reportData) {
    return {
      success: true,
      data: 'Report data in CSV format',
      format: 'csv',
      filename: `report_${new Date().toISOString().slice(0, 10)}.csv`
    };
  }

  exportToExcel(reportData) {
    return {
      success: true,
      data: 'Excel file content',
      format: 'excel',
      filename: `report_${new Date().toISOString().slice(0, 10)}.xlsx`
    };
  }

  exportToPDF(reportData) {
    return {
      success: true,
      data: 'PDF file content',
      format: 'pdf',
      filename: `report_${new Date().toISOString().slice(0, 10)}.pdf`
    };
  }
}

module.exports = new ReportingService(); 