# InsightPulse - AI-Powered Customer Feedback Analytics

Transform customer feedback into actionable insights with AI-powered sentiment analysis and analytics.

## 🚀 Features

- **Omnichannel Feedback Collection**: Intercom, Zendesk, Google Play, App Store, Twitter
- **AI-Powered Sentiment Analysis**: OpenAI GPT-4 for tone and emotion detection
- **Smart Analytics Dashboard**: Real-time insights and trend detection
- **Auto-tagging & Clustering**: Automatic feedback categorization
- **Real-time Alerts**: Instant notifications for sentiment spikes
- **Collaboration Tools**: Team-based feedback management

## 🛠️ Tech Stack

**Backend**: Node.js, Express, PostgreSQL, Redis, OpenAI, Socket.IO
**Frontend**: Next.js, React, TypeScript, Tailwind CSS, Framer Motion

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <repository-url>
cd insightpulse
npm run install:all
```

### 2. Environment Setup
```bash
# Backend
cd backend
cp env.example .env
# Edit .env with your configuration

# Frontend
cd ../frontend
# Create .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Database Setup
```bash
createdb insightpulse
```

### 4. Start Development
```bash
# Start both backend and frontend
npm run dev

# Or start separately
npm run dev:backend  # Backend on :5000
npm run dev:frontend # Frontend on :3000
```

## 📚 API Endpoints

- **Auth**: `/api/auth/*` - Login, register, profile
- **Feedback**: `/api/feedback/*` - CRUD operations
- **Analytics**: `/api/analytics/*` - Dashboard metrics
- **Integrations**: `/api/integrations/*` - Third-party connections
- **Webhooks**: `/api/webhooks/*` - Real-time data ingestion

## 🔧 Environment Variables

**Required Backend Variables:**
```env
DATABASE_URL=postgresql://localhost:5432/insightpulse
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
OPENAI_API_KEY=your_openai_key
```

## 🚀 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## 📄 License

MIT License - see LICENSE file for details.

---

**InsightPulse** - Powering the future of customer feedback analytics with AI. 