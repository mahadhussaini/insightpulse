const OpenAI = require('openai');
const { Op } = require('sequelize');
const Feedback = require('../models/Feedback');
const { redisClient } = require('../config/database');

class FeedbackGPTService {
  constructor() {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not found. Feedback GPT features will be disabled.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  // Main method to process natural language queries about feedback
  async processQuery(userId, query, options = {}) {
    try {
      const {
        timeRange = '30d',
        source = 'all',
        limit = 100,
        includeRawData = false
      } = options;

      // Step 1: Gather relevant feedback data
      const feedbackData = await this.gatherFeedbackData(userId, {
        timeRange,
        source,
        limit
      });

      // Step 2: Generate AI response
      const response = await this.generateAIResponse(query, feedbackData, includeRawData);

      return {
        query,
        response: response.answer,
        insights: response.insights,
        data: includeRawData ? feedbackData : undefined,
        metadata: {
          totalFeedback: feedbackData.length,
          timeRange,
          source,
          processingTime: Date.now()
        }
      };
    } catch (error) {
      console.error('Feedback GPT query error:', error);
      return this.generateFallbackResponse(query, error.message);
    }
  }

  // Gather relevant feedback data based on query and filters
  async gatherFeedbackData(userId, filters) {
    const { timeRange, source, limit } = filters;
    
    // Build where clause
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

    // Get feedback data
    const feedback = await Feedback.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Transform data for AI analysis
    return feedback.map(item => ({
      id: item.id,
      content: item.content,
      title: item.title,
      sentiment: item.sentiment,
      urgency: item.urgency,
      source: item.source,
      customerName: item.customerName,
      customerEmail: item.customerEmail,
      categories: item.categories,
      tags: item.tags,
      emotions: item.emotions,
      createdAt: item.createdAt,
      isResolved: item.isResolved,
      resolutionNotes: item.resolutionNotes
    }));
  }

  // Generate AI response to the query
  async generateAIResponse(query, feedbackData, includeRawData) {
    if (!this.openai) {
      return this.generateFallbackResponse(query, 'AI service unavailable');
    }

    // Prepare context for AI
    const context = this.prepareContext(feedbackData);
    
    const prompt = `
You are an expert customer feedback analyst. A user has asked: "${query}"

Here is the relevant feedback data to analyze:

${context}

Please provide:
1. A clear, actionable answer to their question
2. Key insights and patterns you discovered
3. Specific recommendations based on the data
4. Confidence level in your analysis (high/medium/low)

Focus on being helpful, specific, and actionable. Use the actual feedback examples when relevant.

Respond in JSON format:
{
  "answer": "Your detailed answer here...",
  "insights": [
    "Key insight 1",
    "Key insight 2"
  ],
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2"
  ],
  "confidence": "high|medium|low",
  "dataPoints": {
    "totalFeedback": ${feedbackData.length},
    "positiveCount": ${feedbackData.filter(f => f.sentiment === 'positive').length},
    "negativeCount": ${feedbackData.filter(f => f.sentiment === 'negative').length},
    "topSources": ["source1", "source2"],
    "topCategories": ["category1", "category2"]
  }
}
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert customer feedback analyst. Provide clear, actionable insights based on the data provided."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  // Prepare context from feedback data
  prepareContext(feedbackData) {
    if (feedbackData.length === 0) {
      return "No feedback data available for the specified time period and filters.";
    }

    // Group by sentiment
    const positiveFeedback = feedbackData.filter(f => f.sentiment === 'positive');
    const negativeFeedback = feedbackData.filter(f => f.sentiment === 'negative');
    const neutralFeedback = feedbackData.filter(f => f.sentiment === 'neutral');

    // Get top categories
    const allCategories = feedbackData
      .flatMap(f => f.categories || [])
      .filter(Boolean);
    const categoryCounts = {};
    allCategories.forEach(cat => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([cat, count]) => `${cat} (${count})`);

    // Get top sources
    const sourceCounts = {};
    feedbackData.forEach(f => {
      sourceCounts[f.source] = (sourceCounts[f.source] || 0) + 1;
    });
    const topSources = Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([source, count]) => `${source} (${count})`);

    // Sample feedback examples
    const samplePositive = positiveFeedback.slice(0, 3).map(f => `"${f.content}"`).join('\n');
    const sampleNegative = negativeFeedback.slice(0, 3).map(f => `"${f.content}"`).join('\n');

    return `
Feedback Summary:
- Total feedback: ${feedbackData.length}
- Positive: ${positiveFeedback.length}
- Negative: ${negativeFeedback.length}
- Neutral: ${neutralFeedback.length}

Top Categories: ${topCategories.join(', ')}
Top Sources: ${topSources.join(', ')}

Sample Positive Feedback:
${samplePositive}

Sample Negative Feedback:
${sampleNegative}

Recent Feedback (last 10):
${feedbackData.slice(0, 10).map(f => `[${f.sentiment}] ${f.source}: "${f.content}"`).join('\n')}
    `;
  }

  // Generate fallback response when AI is unavailable
  generateFallbackResponse(query, error) {
    return {
      answer: `I'm unable to process your query "${query}" at the moment. The AI service is currently unavailable. Please try again later or contact support if the issue persists.`,
      insights: [
        "AI service is temporarily unavailable",
        "Please check your OpenAI API configuration"
      ],
      recommendations: [
        "Verify your OpenAI API key is set correctly",
        "Check your internet connection",
        "Try again in a few minutes"
      ],
      confidence: "low",
      dataPoints: {
        totalFeedback: 0,
        positiveCount: 0,
        negativeCount: 0,
        topSources: [],
        topCategories: []
      }
    };
  }

  // Predefined queries for quick access
  getPredefinedQueries() {
    return [
      {
        id: 'churn_analysis',
        title: 'Why are users uninstalling?',
        description: 'Analyze negative feedback to identify churn drivers',
        category: 'retention'
      },
      {
        id: 'feature_requests',
        title: 'What features do users want most?',
        description: 'Identify top feature requests and demand signals',
        category: 'product'
      },
      {
        id: 'pain_points',
        title: 'What are the biggest pain points?',
        description: 'Find the most common user complaints and issues',
        category: 'support'
      },
      {
        id: 'onboarding_issues',
        title: 'How is our onboarding experience?',
        description: 'Analyze feedback related to user onboarding',
        category: 'ux'
      },
      {
        id: 'pricing_feedback',
        title: 'What do users think about our pricing?',
        description: 'Gather insights about pricing and value perception',
        category: 'business'
      },
      {
        id: 'competitor_comparison',
        title: 'How do we compare to competitors?',
        description: 'Analyze feedback mentioning competitors',
        category: 'market'
      }
    ];
  }

  // Get query suggestions based on current feedback data
  async getQuerySuggestions(userId) {
    try {
      const recentFeedback = await Feedback.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      const suggestions = [];
      
      // Analyze patterns to suggest relevant queries
      const negativeCount = recentFeedback.filter(f => f.sentiment === 'negative').length;
      const positiveCount = recentFeedback.filter(f => f.sentiment === 'positive').length;
      
      if (negativeCount > positiveCount) {
        suggestions.push({
          query: 'Why are we getting so much negative feedback?',
          reason: 'High negative sentiment detected'
        });
      }

      const sources = [...new Set(recentFeedback.map(f => f.source))];
      if (sources.length > 3) {
        suggestions.push({
          query: 'Which feedback source is most reliable?',
          reason: 'Multiple feedback sources detected'
        });
      }

      const urgencyCount = recentFeedback.filter(f => f.urgency === 'high' || f.urgency === 'critical').length;
      if (urgencyCount > 0) {
        suggestions.push({
          query: 'What urgent issues need immediate attention?',
          reason: 'High urgency feedback detected'
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Error generating query suggestions:', error);
      return [];
    }
  }
}

module.exports = new FeedbackGPTService(); 