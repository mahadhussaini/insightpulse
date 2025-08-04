# InsightPulse Backend API

A powerful Node.js/Express backend for the InsightPulse SaaS platform - an AI-powered customer feedback and sentiment analytics tool.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **AI-Powered Analysis**: OpenAI integration for sentiment analysis and insights
- **Omnichannel Integration**: Webhooks for Intercom, Zendesk, Google Play, App Store, Twitter
- **Real-time Analytics**: Comprehensive dashboard with real-time updates
- **Subscription Management**: Stripe integration for billing
- **Caching**: Redis for performance optimization
- **Database**: PostgreSQL with Sequelize ORM

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- OpenAI API key
- Stripe account (for payments)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd insightpulse/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://localhost:5432/insightpulse
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Stripe (optional)
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   ```

4. **Database Setup**
   ```bash
   # Create database
   createdb insightpulse
   
   # Run migrations (in development)
   npm run dev
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "company": "Acme Corp"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Feedback Endpoints

#### Get All Feedback
```http
GET /api/feedback?page=1&limit=20&sentiment=negative
Authorization: Bearer <token>
```

#### Create Feedback
```http
POST /api/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great app, but needs better UX",
  "source": "manual",
  "customerName": "Jane Smith",
  "customerEmail": "jane@example.com",
  "rating": 4
}
```

### Analytics Endpoints

#### Dashboard Overview
```http
GET /api/analytics/overview
Authorization: Bearer <token>
```

#### Sentiment Trends
```http
GET /api/analytics/sentiment-trends?period=weekly
Authorization: Bearer <token>
```

#### AI Insights
```http
GET /api/analytics/insights
Authorization: Bearer <token>
```

### Integrations Endpoints

#### Get Integrations
```http
GET /api/integrations
Authorization: Bearer <token>
```

#### Create Integration
```http
POST /api/integrations
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "intercom",
  "name": "Intercom Support",
  "config": {
    "workspaceId": "workspace_123",
    "apiKey": "your_api_key"
  }
}
```

### Webhook Endpoints

#### Intercom Webhook
```http
POST /api/webhooks/intercom/:userId
Content-Type: application/json
X-Hub-Signature: sha256=<signature>

{
  "data": {
    "item": {
      "type": "conversation",
      "conversation": {
        "id": 123,
        "conversation_message": {
          "body": "Customer feedback here"
        }
      }
    }
  }
}
```

## 🏗️ Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── errorHandler.js     # Error handling middleware
├── models/
│   ├── User.js             # User model
│   └── Feedback.js         # Feedback model
├── routes/
│   ├── auth.js             # Authentication routes
│   ├── feedback.js         # Feedback CRUD routes
│   ├── analytics.js        # Analytics routes
│   ├── integrations.js     # Integration management
│   ├── webhooks.js         # Webhook endpoints
│   └── dashboard.js        # Dashboard routes
├── services/
│   └── aiService.js        # AI analysis service
├── server.js               # Main server file
├── package.json
└── README.md
```

## 🔧 Development

### Running in Development
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Database Migrations
```bash
npm run migrate
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `PORT` | Server port | No (default: 5000) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `FRONTEND_URL` | Frontend URL for CORS | No |

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive request validation
- **CORS Protection**: Configured CORS for frontend
- **Helmet**: Security headers middleware
- **SQL Injection Protection**: Sequelize ORM with parameterized queries

## 🤖 AI Integration

The platform uses OpenAI's GPT-4 for:

- **Sentiment Analysis**: Analyze feedback tone and emotions
- **Categorization**: Auto-categorize feedback by type
- **Insights Generation**: Generate actionable insights
- **Response Suggestions**: Suggest customer service responses
- **Trend Analysis**: Identify patterns and trends

## 📊 Database Schema

### Users Table
- User authentication and profile data
- Subscription and billing information
- Role-based permissions
- User preferences

### Feedback Table
- Customer feedback content
- AI analysis results (sentiment, emotions, categories)
- Source platform information
- Resolution tracking
- Metadata and tags

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
   ```bash
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:5432/insightpulse
   REDIS_URL=redis://host:6379
   JWT_SECRET=your_production_secret
   OPENAI_API_KEY=your_openai_key
   ```

2. **Database Migration**
   ```bash
   npm run migrate
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 📈 Monitoring

- **Health Check**: `GET /health`
- **Error Logging**: Comprehensive error handling and logging
- **Performance Monitoring**: Redis caching for performance
- **Database Monitoring**: Sequelize query logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the error logs

---

**InsightPulse Backend** - Powering the future of customer feedback analytics with AI. 