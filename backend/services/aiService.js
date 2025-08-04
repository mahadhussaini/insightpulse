const OpenAI = require('openai');
const { redisClient } = require('../config/database');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
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
          "urgency": "low|medium|high|critical",
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
      throw new Error('Failed to analyze sentiment');
    }
  }

  // Generate insights from feedback data
  async generateInsights(feedbackData) {
    try {
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
      throw new Error('Failed to generate insights');
    }
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

        Trends:
        ${trends.map(trend => `- ${trend.description}`).join('\n')}

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
      throw new Error('Failed to generate weekly summary');
    }
  }
}

module.exports = new AIService(); 