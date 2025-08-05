const OpenAI = require('openai');
const { redisClient } = require('../config/database');

class AIService {
  constructor() {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key not found. AI features will be disabled.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }
  }

  // Analyze sentiment and emotions from feedback text
  async analyzeSentiment(text, language = 'en') {
    try {
      const cacheKey = `sentiment:${Buffer.from(text).toString('base64')}`;
      
      // Check cache first
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // If OpenAI is not available, return a fallback analysis
      if (!this.openai) {
        return this.generateFallbackSentimentAnalysis(text);
      }

      const prompt = `
        Analyze the following customer feedback and provide:
        1. Sentiment (positive/negative/neutral/mixed)
        2. Sentiment score (-1 to 1, where -1 is very negative, 1 is very positive)
        3. Emotions detected (joy, sadness, anger, fear, surprise, disgust, trust, anticipation)
        4. Urgency level (low/medium/high/critical)
        5. Key topics/categories mentioned
        6. Suggested action items

        Feedback: "${text}"
        Language: ${language}

        Respond in JSON format:
        {
          "sentiment": "positive|negative|neutral|mixed",
          "sentimentScore": -0.8,
          "emotions": {
            "joy": 0.1,
            "sadness": 0.8,
            "anger": 0.3,
            "fear": 0.1,
            "surprise": 0.0,
            "disgust": 0.0,
            "trust": 0.2,
            "anticipation": 0.1
          },
          "urgency": "low|medium/high|critical",
          "categories": ["billing", "technical_issue", "feature_request"],
          "topics": ["payment", "app_crash", "new_feature"],
          "suggestedActions": ["contact customer", "escalate to engineering", "add to roadmap"]
        }
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert customer feedback analyst. Analyze feedback with high accuracy and provide actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const result = JSON.parse(completion.choices[0].message.content);
      
      // Cache the result for 24 hours
      await redisClient.setEx(cacheKey, 24 * 60 * 60, JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('AI sentiment analysis error:', error);
      // Return fallback analysis if AI fails
      return this.generateFallbackSentimentAnalysis(text);
    }
  }

  // Generate fallback sentiment analysis when AI is not available
  generateFallbackSentimentAnalysis(text) {
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'like', 'happy', 'satisfied', 'awesome', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'horrible', 'worst'];
    const urgentWords = ['urgent', 'critical', 'emergency', 'broken', 'crash', 'error', 'fail', 'issue', 'problem'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    let urgentCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    urgentWords.forEach(word => {
      if (lowerText.includes(word)) urgentCount++;
    });
    
    let sentiment = 'neutral';
    let sentimentScore = 0;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      sentimentScore = Math.min(0.8, positiveCount * 0.2);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      sentimentScore = Math.max(-0.8, -negativeCount * 0.2);
    }
    
    let urgency = 'low';
    if (urgentCount > 2) urgency = 'critical';
    else if (urgentCount > 0) urgency = 'high';
    
    return {
      sentiment,
      sentimentScore,
      emotions: {
        joy: sentiment === 'positive' ? 0.6 : 0.1,
        sadness: sentiment === 'negative' ? 0.6 : 0.1,
        anger: sentiment === 'negative' ? 0.4 : 0.1,
        fear: urgency === 'critical' ? 0.5 : 0.1,
        surprise: 0.1,
        disgust: 0.1,
        trust: sentiment === 'positive' ? 0.6 : 0.2,
        anticipation: 0.1
      },
      urgency,
      categories: ['general'],
      topics: ['feedback'],
      suggestedActions: ['review feedback', 'follow up if needed']
    };
  }

  // Generate insights from feedback data
  async generateInsights(feedbackData) {
    try {
      // If OpenAI is not available, return a fallback insights
      if (!this.openai) {
        return this.generateFallbackInsights(feedbackData);
      }

      const prompt = `
        Analyze the following customer feedback data and provide insights:

        Feedback Summary:
        - Total feedback: ${feedbackData.total}
        - Positive: ${feedbackData.positive}
        - Negative: ${feedbackData.negative}
        - Neutral: ${feedbackData.neutral}
        - Average sentiment score: ${feedbackData.avgSentiment}
        - Top categories: ${feedbackData.topCategories.join(', ')}
        - Recent trends: ${feedbackData.recentTrends.join(', ')}

        Generate insights in JSON format:
        {
          "overallSentiment": "improving|declining|stable",
          "keyInsights": [
            "insight 1",
            "insight 2",
            "insight 3"
          ],
          "trends": [
            "trend 1",
            "trend 2"
          ],
          "recommendations": [
            "recommendation 1",
            "recommendation 2"
          ],
          "riskFactors": [
            "risk 1",
            "risk 2"
          ],
          "opportunities": [
            "opportunity 1",
            "opportunity 2"
          ]
        }
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a customer experience expert. Provide actionable insights and recommendations based on feedback data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 800
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('AI insights generation error:', error);
      // Return fallback insights if AI fails
      return this.generateFallbackInsights(feedbackData);
    }
  }

  // Generate fallback insights when AI is not available
  generateFallbackInsights(feedbackData) {
    const totalFeedback = feedbackData.total;
    const positiveRate = totalFeedback > 0 ? (feedbackData.positive / totalFeedback * 100).toFixed(1) : 0;
    const negativeRate = totalFeedback > 0 ? (feedbackData.negative / totalFeedback * 100).toFixed(1) : 0;
    
    let overallSentiment = 'stable';
    if (feedbackData.avgSentiment > 0.3) overallSentiment = 'improving';
    else if (feedbackData.avgSentiment < -0.3) overallSentiment = 'declining';

    return {
      overallSentiment,
      keyInsights: [
        `Total feedback volume: ${totalFeedback} items`,
        `Positive sentiment: ${positiveRate}%`,
        `Negative sentiment: ${negativeRate}%`,
        `Average sentiment score: ${feedbackData.avgSentiment.toFixed(2)}`
      ],
      trends: [
        'Monitor daily feedback patterns',
        'Track sentiment changes over time'
      ],
      recommendations: [
        'Address negative feedback promptly',
        'Analyze top categories for improvement',
        'Maintain positive customer experiences'
      ],
      riskFactors: [
        'High negative sentiment rate',
        'Unresolved feedback items'
      ],
      opportunities: [
        'Improve customer satisfaction',
        'Enhance product features',
        'Optimize support processes'
      ]
    };
  }

  // Categorize feedback automatically
  async categorizeFeedback(text, existingCategories = []) {
    try {
      const prompt = `
        Categorize the following customer feedback into relevant categories.
        Available categories: ${existingCategories.join(', ') || 'general, technical, billing, feature_request, bug_report, complaint, praise, suggestion'}

        Feedback: "${text}"

        Respond in JSON format:
        {
          "primaryCategory": "category_name",
          "secondaryCategories": ["category1", "category2"],
          "confidence": 0.85,
          "tags": ["tag1", "tag2", "tag3"]
        }
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a feedback categorization expert. Accurately categorize customer feedback into relevant categories."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 300
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('AI categorization error:', error);
      throw new Error('Failed to categorize feedback');
    }
  }

  // Generate response suggestions
  async generateResponseSuggestions(feedback, context = {}) {
    try {
      const prompt = `
        Generate professional response suggestions for the following customer feedback:

        Feedback: "${feedback.content}"
        Sentiment: ${feedback.sentiment}
        Urgency: ${feedback.urgency}
        Categories: ${feedback.categories?.join(', ') || 'general'}

        Context:
        - Company tone: ${context.companyTone || 'professional and helpful'}
        - Response style: ${context.responseStyle || 'empathetic and solution-oriented'}

        Generate 3 response suggestions in JSON format:
        {
          "suggestions": [
            {
              "type": "immediate_response",
              "content": "response text",
              "tone": "empathetic|professional|casual",
              "priority": "high|medium|low"
            },
            {
              "type": "follow_up",
              "content": "response text",
              "tone": "empathetic|professional|casual",
              "priority": "high|medium|low"
            },
            {
              "type": "escalation",
              "content": "response text",
              "tone": "empathetic|professional|casual",
              "priority": "high|medium|low"
            }
          ]
        }
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a customer service expert. Generate professional and empathetic response suggestions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 600
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('AI response generation error:', error);
      throw new Error('Failed to generate response suggestions');
    }
  }

  // Detect language of feedback
  async detectLanguage(text) {
    try {
      const prompt = `
        Detect the language of the following text and respond with the ISO 639-1 language code:

        Text: "${text}"

        Respond only with the language code (e.g., "en", "es", "fr", "de", "ja", "zh", "ko", "ar", "hi", "pt")
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a language detection expert. Respond only with the ISO 639-1 language code."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 10
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI language detection error:', error);
      return 'en'; // Default to English
    }
  }

  // Generate weekly summary
  async generateWeeklySummary(feedbackStats, topIssues, trends) {
    try {
      // If OpenAI is not available, return a fallback summary
      if (!this.openai) {
        return this.generateFallbackWeeklySummary(feedbackStats, topIssues, trends);
      }

      const prompt = `
        Generate a weekly customer feedback summary based on the following data:

        Statistics:
        - Total feedback: ${feedbackStats.total}
        - Positive: ${feedbackStats.positive}
        - Negative: ${feedbackStats.negative}
        - Neutral: ${feedbackStats.neutral}
        - Average sentiment: ${feedbackStats.avgSentiment}

        Top Issues:
        ${topIssues.map(issue => `- ${issue.category}: ${issue.count} mentions`).join('\n')}

        Trends (Daily Data):
        ${trends.map(trend => `- ${trend.date}: ${trend.count} feedback items, avg sentiment: ${trend.avgSentiment}`).join('\n')}

        Generate a professional summary in JSON format:
        {
          "summary": "Brief overview of the week",
          "keyFindings": [
            "finding 1",
            "finding 2",
            "finding 3"
          ],
          "recommendations": [
            "recommendation 1",
            "recommendation 2"
          ],
          "metrics": {
            "customerSatisfaction": "improving|declining|stable",
            "responseTime": "good|needs_improvement",
            "issueResolution": "effective|needs_attention"
          }
        }
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a customer experience analyst. Generate professional weekly summaries with actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('AI weekly summary error:', error);
      // Return fallback summary if AI fails
      return this.generateFallbackWeeklySummary(feedbackStats, topIssues, trends);
    }
  }

  // Generate fallback weekly summary when AI is not available
  generateFallbackWeeklySummary(feedbackStats, topIssues, trends) {
    const totalFeedback = feedbackStats.total;
    const positiveRate = totalFeedback > 0 ? (feedbackStats.positive / totalFeedback * 100).toFixed(1) : 0;
    const negativeRate = totalFeedback > 0 ? (feedbackStats.negative / totalFeedback * 100).toFixed(1) : 0;
    
    const topIssue = topIssues.length > 0 ? topIssues[0].category : 'General';
    const avgSentiment = feedbackStats.avgSentiment;
    
    let customerSatisfaction = 'stable';
    if (avgSentiment > 0.3) customerSatisfaction = 'improving';
    else if (avgSentiment < -0.3) customerSatisfaction = 'declining';

    return {
      summary: `Weekly feedback summary: ${totalFeedback} total feedback items with ${positiveRate}% positive and ${negativeRate}% negative sentiment.`,
      keyFindings: [
        `Total feedback volume: ${totalFeedback} items`,
        `Positive sentiment rate: ${positiveRate}%`,
        `Negative sentiment rate: ${negativeRate}%`,
        `Top issue category: ${topIssue}`
      ],
      recommendations: [
        'Monitor feedback trends daily',
        'Address negative feedback promptly',
        'Analyze top issues for improvement opportunities'
      ],
      metrics: {
        customerSatisfaction,
        responseTime: 'good',
        issueResolution: 'effective'
      }
    };
  }
}

module.exports = new AIService(); 