const Feedback = require('../models/Feedback');
const { redisClient } = require('../config/database');

class CompetitorAnalysisService {
  constructor() {
    this.competitorKeywords = {
      'intercom': ['intercom', 'intercom chat', 'intercom support'],
      'zendesk': ['zendesk', 'zendesk support', 'zendesk chat'],
      'freshdesk': ['freshdesk', 'freshdesk support'],
      'helpscout': ['helpscout', 'help scout', 'help desk'],
      'slack': ['slack', 'slack chat', 'slack communication'],
      'discord': ['discord', 'discord chat', 'discord server'],
      'microsoft_teams': ['teams', 'microsoft teams', 'ms teams'],
      'salesforce': ['salesforce', 'sfdc', 'crm'],
      'hubspot': ['hubspot', 'hubspot crm', 'marketing hub'],
      'pipedrive': ['pipedrive', 'pipedrive crm'],
      'notion': ['notion', 'notion workspace'],
      'asana': ['asana', 'asana project'],
      'trello': ['trello', 'trello board'],
      'jira': ['jira', 'atlassian jira'],
      'linear': ['linear', 'linear app'],
      'clickup': ['clickup', 'click up'],
      'airtable': ['airtable', 'air table'],
      'figma': ['figma', 'figma design'],
      'sketch': ['sketch', 'sketch app'],
      'adobe': ['adobe', 'photoshop', 'illustrator']
    };

    this.competitorCategories = {
      'customer_support': ['intercom', 'zendesk', 'freshdesk', 'helpscout'],
      'communication': ['slack', 'discord', 'microsoft_teams'],
      'crm': ['salesforce', 'hubspot', 'pipedrive'],
      'productivity': ['notion', 'asana', 'trello', 'jira', 'linear', 'clickup'],
      'design': ['figma', 'sketch', 'adobe']
    };

    this.sentimentImpact = {
      'positive': 1,
      'negative': -1,
      'neutral': 0,
      'mixed': 0
    };
  }

  // Analyze competitor mentions in feedback
  async analyzeCompetitorMentions(userId, timeRange = '30d') {
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

      const mentions = this.extractMentions(feedback);
      const analysis = this.analyzeMentions(mentions);

      return {
        success: true,
        data: {
          totalMentions: mentions.length,
          competitors: analysis.competitors,
          categories: analysis.categories,
          trends: analysis.trends,
          insights: analysis.insights,
          recommendations: analysis.recommendations
        }
      };
    } catch (error) {
      console.error('Error analyzing competitor mentions:', error);
      return { success: false, error: error.message };
    }
  }

  // Extract competitor mentions from feedback
  extractMentions(feedback) {
    const mentions = [];

    feedback.forEach(item => {
      const content = item.content.toLowerCase();
      const customerName = item.customerName || 'Anonymous';
      const sentiment = item.sentiment;
      const createdAt = item.createdAt;

      Object.entries(this.competitorKeywords).forEach(([competitor, keywords]) => {
        keywords.forEach(keyword => {
          if (content.includes(keyword)) {
            mentions.push({
              id: `${item.id}-${competitor}`,
              competitor,
              keyword,
              content: item.content,
              customerName,
              sentiment,
              createdAt,
              feedbackId: item.id,
              context: this.extractContext(content, keyword)
            });
          }
        });
      });
    });

    return mentions;
  }

  // Analyze mentions for insights
  analyzeMentions(mentions) {
    const competitors = {};
    const categories = {};
    const trends = {};

    // Group by competitor
    mentions.forEach(mention => {
      if (!competitors[mention.competitor]) {
        competitors[mention.competitor] = {
          name: mention.competitor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          mentions: [],
          sentiment: { positive: 0, negative: 0, neutral: 0, mixed: 0 },
          totalMentions: 0,
          avgSentiment: 0
        };
      }

      competitors[mention.competitor].mentions.push(mention);
      competitors[mention.competitor].totalMentions++;
      competitors[mention.competitor].sentiment[mention.sentiment]++;
    });

    // Calculate sentiment scores
    Object.values(competitors).forEach(competitor => {
      const total = competitor.totalMentions;
      const sentimentScore = (
        (competitor.sentiment.positive * this.sentimentImpact.positive) +
        (competitor.sentiment.negative * this.sentimentImpact.negative) +
        (competitor.sentiment.neutral * this.sentimentImpact.neutral) +
        (competitor.sentiment.mixed * this.sentimentImpact.mixed)
      ) / total;

      competitor.avgSentiment = sentimentScore;
      competitor.sentimentPercentage = {
        positive: (competitor.sentiment.positive / total) * 100,
        negative: (competitor.sentiment.negative / total) * 100,
        neutral: (competitor.sentiment.neutral / total) * 100,
        mixed: (competitor.sentiment.mixed / total) * 100
      };
    });

    // Group by category
    Object.entries(this.competitorCategories).forEach(([category, categoryCompetitors]) => {
      categories[category] = {
        name: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        competitors: categoryCompetitors,
        totalMentions: 0,
        avgSentiment: 0
      };

      categoryCompetitors.forEach(competitor => {
        if (competitors[competitor]) {
          categories[category].totalMentions += competitors[competitor].totalMentions;
          categories[category].avgSentiment += competitors[competitor].avgSentiment;
        }
      });

      if (categories[category].totalMentions > 0) {
        categories[category].avgSentiment /= categoryCompetitors.length;
      }
    });

    // Analyze trends
    const timeGroups = this.groupByTime(mentions);
    Object.entries(timeGroups).forEach(([period, periodMentions]) => {
      trends[period] = {
        totalMentions: periodMentions.length,
        topCompetitors: this.getTopCompetitors(periodMentions, 3),
        sentimentTrend: this.calculateSentimentTrend(periodMentions)
      };
    });

    return {
      competitors,
      categories,
      trends,
      insights: this.generateInsights(competitors, categories, trends),
      recommendations: this.generateRecommendations(competitors, categories)
    };
  }

  // Extract context around mention
  extractContext(content, keyword) {
    const index = content.toLowerCase().indexOf(keyword);
    if (index === -1) return '';

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + keyword.length + 50);
    return content.substring(start, end);
  }

  // Group mentions by time period
  groupByTime(mentions) {
    const groups = {
      'last_7_days': [],
      'last_30_days': [],
      'last_90_days': []
    };

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    mentions.forEach(mention => {
      const mentionDate = new Date(mention.createdAt);
      
      if (mentionDate >= sevenDaysAgo) {
        groups['last_7_days'].push(mention);
      }
      if (mentionDate >= thirtyDaysAgo) {
        groups['last_30_days'].push(mention);
      }
      if (mentionDate >= ninetyDaysAgo) {
        groups['last_90_days'].push(mention);
      }
    });

    return groups;
  }

  // Get top competitors by mentions
  getTopCompetitors(mentions, limit = 5) {
    const competitorCounts = {};
    
    mentions.forEach(mention => {
      competitorCounts[mention.competitor] = (competitorCounts[mention.competitor] || 0) + 1;
    });

    return Object.entries(competitorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([competitor, count]) => ({
        competitor,
        count,
        name: competitor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));
  }

  // Calculate sentiment trend
  calculateSentimentTrend(mentions) {
    if (mentions.length === 0) return 'neutral';

    const totalSentiment = mentions.reduce((sum, mention) => {
      return sum + this.sentimentImpact[mention.sentiment];
    }, 0);

    const avgSentiment = totalSentiment / mentions.length;

    if (avgSentiment > 0.1) return 'positive';
    if (avgSentiment < -0.1) return 'negative';
    return 'neutral';
  }

  // Generate insights
  generateInsights(competitors, categories, trends) {
    const insights = [];

    // Top competitor insight
    const topCompetitor = Object.entries(competitors)
      .sort(([,a], [,b]) => b.totalMentions - a.totalMentions)[0];

    if (topCompetitor) {
      insights.push({
        type: 'top_competitor',
        title: `${topCompetitor[1].name} is your top competitor`,
        description: `Mentioned ${topCompetitor[1].totalMentions} times in customer feedback`,
        priority: 'high'
      });
    }

    // Sentiment insights
    Object.entries(competitors).forEach(([competitor, data]) => {
      if (data.sentiment.negative > data.sentiment.positive) {
        insights.push({
          type: 'negative_sentiment',
          title: `Negative sentiment towards ${data.name}`,
          description: `${data.sentiment.negative} negative mentions vs ${data.sentiment.positive} positive`,
          priority: 'medium',
          competitor
        });
      }
    });

    // Category insights
    Object.entries(categories).forEach(([category, data]) => {
      if (data.totalMentions > 10) {
        insights.push({
          type: 'category_insight',
          title: `${data.name} tools frequently mentioned`,
          description: `${data.totalMentions} mentions in this category`,
          priority: 'medium',
          category
        });
      }
    });

    return insights;
  }

  // Generate recommendations
  generateRecommendations(competitors, categories) {
    const recommendations = [];

    // Feature recommendations based on competitor mentions
    Object.entries(competitors).forEach(([competitor, data]) => {
      if (data.totalMentions > 5) {
        recommendations.push({
          type: 'feature_development',
          title: `Consider ${competitor.replace('_', ' ')} features`,
          description: `Customers frequently mention ${data.name} - consider adding similar functionality`,
          priority: 'high',
          competitor,
          impact: 'high'
        });
      }
    });

    // Competitive positioning
    const negativeCompetitors = Object.entries(competitors)
      .filter(([, data]) => data.sentiment.negative > data.sentiment.positive)
      .sort(([,a], [,b]) => b.sentiment.negative - a.sentiment.negative);

    if (negativeCompetitors.length > 0) {
      recommendations.push({
        type: 'competitive_positioning',
        title: 'Highlight competitive advantages',
        description: `Customers express dissatisfaction with ${negativeCompetitors[0][1].name} - emphasize your strengths`,
        priority: 'medium',
        impact: 'medium'
      });
    }

    return recommendations;
  }

  // Get competitor comparison
  async getCompetitorComparison(userId, competitors = []) {
    try {
      const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
      
      const feedback = await Feedback.findAll({
        where: {
          userId,
          createdAt: {
            [require('sequelize').Op.gte]: startDate
          }
        },
        order: [['created_at', 'DESC']]
      });

      const mentions = this.extractMentions(feedback);
      const comparison = {};

      competitors.forEach(competitor => {
        const competitorMentions = mentions.filter(m => m.competitor === competitor);
        comparison[competitor] = {
          totalMentions: competitorMentions.length,
          sentiment: this.calculateSentimentDistribution(competitorMentions),
          trends: this.calculateTrends(competitorMentions),
          context: this.extractCommonContexts(competitorMentions)
        };
      });

      return {
        success: true,
        data: comparison
      };
    } catch (error) {
      console.error('Error getting competitor comparison:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate sentiment distribution
  calculateSentimentDistribution(mentions) {
    const distribution = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
    
    mentions.forEach(mention => {
      distribution[mention.sentiment]++;
    });

    const total = mentions.length;
    if (total > 0) {
      Object.keys(distribution).forEach(key => {
        distribution[key] = (distribution[key] / total) * 100;
      });
    }

    return distribution;
  }

  // Calculate trends
  calculateTrends(mentions) {
    const monthlyGroups = {};
    
    mentions.forEach(mention => {
      const month = new Date(mention.createdAt).toISOString().slice(0, 7);
      if (!monthlyGroups[month]) {
        monthlyGroups[month] = [];
      }
      monthlyGroups[month].push(mention);
    });

    return Object.entries(monthlyGroups).map(([month, monthMentions]) => ({
      month,
      count: monthMentions.length,
      sentiment: this.calculateSentimentTrend(monthMentions)
    }));
  }

  // Extract common contexts
  extractCommonContexts(mentions) {
    const contexts = mentions.map(m => m.context).filter(c => c.length > 0);
    return contexts.slice(0, 5); // Return top 5 contexts
  }

  // Get start date based on time range
  getStartDate(timeRange) {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Get competitor list
  getCompetitorList() {
    return Object.keys(this.competitorKeywords).map(competitor => ({
      id: competitor,
      name: competitor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      category: this.getCompetitorCategory(competitor)
    }));
  }

  // Get competitor category
  getCompetitorCategory(competitor) {
    for (const [category, competitors] of Object.entries(this.competitorCategories)) {
      if (competitors.includes(competitor)) {
        return category;
      }
    }
    return 'other';
  }

  // Get category list
  getCategoryList() {
    return Object.keys(this.competitorCategories).map(category => ({
      id: category,
      name: category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      competitors: this.competitorCategories[category]
    }));
  }
}

module.exports = new CompetitorAnalysisService(); 