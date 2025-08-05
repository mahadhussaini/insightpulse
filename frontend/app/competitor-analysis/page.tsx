'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  BarChart3,
  PieChart,
  Users,
  MessageSquare,
  Eye,
  Search,
  Zap,
  Lightbulb,
  Shield,
  Crown,
  Star,
  Activity
} from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  category: string;
}

interface CompetitorAnalysis {
  totalMentions: number;
  competitors: {
    [key: string]: {
      name: string;
      mentions: any[];
      sentiment: {
        positive: number;
        negative: number;
        neutral: number;
        mixed: number;
      };
      totalMentions: number;
      avgSentiment: number;
      sentimentPercentage: {
        positive: number;
        negative: number;
        neutral: number;
        mixed: number;
      };
    };
  };
  categories: {
    [key: string]: {
      name: string;
      competitors: string[];
      totalMentions: number;
      avgSentiment: number;
    };
  };
  trends: {
    [key: string]: {
      totalMentions: number;
      topCompetitors: Array<{
        competitor: string;
        count: number;
        name: string;
      }>;
      sentimentTrend: string;
    };
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
    competitor?: string;
    category?: string;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: string;
    impact: string;
    competitor?: string;
  }>;
}

interface CompetitorMention {
  id: string;
  competitor: string;
  keyword: string;
  content: string;
  customerName: string;
  sentiment: string;
  createdAt: string;
  feedbackId: string;
  context: string;
}

export default function CompetitorAnalysisPage() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [mentions, setMentions] = useState<CompetitorMention[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  useEffect(() => {
    loadCompetitorData();
  }, [timeRange]);

  const loadCompetitorData = async () => {
    setIsLoading(true);
    try {
      const [analysisResponse, competitorsResponse, mentionsResponse] = await Promise.all([
        api.get('/competitor-analysis/overview', {
          params: { timeRange }
        }),
        api.get('/competitor-analysis/competitors'),
        api.get('/competitor-analysis/mentions', {
          params: { timeRange }
        })
      ]);

      setAnalysis(analysisResponse.data.data);
      setCompetitors(competitorsResponse.data.data);
      setMentions(mentionsResponse.data.data.mentions);
    } catch (error) {
      console.error('Error loading competitor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      case 'neutral': return 'default';
      case 'mixed': return 'warning';
      default: return 'default';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <CheckCircle className="w-4 h-4" />;
      case 'negative': return <XCircle className="w-4 h-4" />;
      case 'neutral': return <Activity className="w-4 h-4" />;
      case 'mixed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customer_support': return <MessageSquare className="w-4 h-4" />;
      case 'communication': return <Users className="w-4 h-4" />;
      case 'crm': return <Target className="w-4 h-4" />;
      case 'productivity': return <BarChart3 className="w-4 h-4" />;
      case 'design': return <Eye className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCompetitorIcon = (competitorId: string) => {
    if (competitorId.includes('slack')) return <MessageSquare className="w-4 h-4" />;
    if (competitorId.includes('salesforce')) return <Target className="w-4 h-4" />;
    if (competitorId.includes('notion')) return <BarChart3 className="w-4 h-4" />;
    if (competitorId.includes('figma')) return <Eye className="w-4 h-4" />;
    return <Crown className="w-4 h-4" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access Competitor Analysis</h1>
          <Button>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Competitor Analysis
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track competitor mentions, analyze sentiment trends, and gain competitive intelligence from your customer feedback.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Analysis Filters
              </h2>
              <div className="flex space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Competitor</label>
                  <select
                    value={selectedCompetitor || ''}
                    onChange={(e) => setSelectedCompetitor(e.target.value || null)}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">All competitors</option>
                    {competitors.map((competitor) => (
                      <option key={competitor.id} value={competitor.id}>
                        {competitor.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'competitors', name: 'Competitors', icon: Crown },
              { id: 'categories', name: 'Categories', icon: PieChart },
              { id: 'mentions', name: 'Mentions', icon: MessageSquare },
              { id: 'insights', name: 'Insights', icon: Lightbulb }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Analyzing competitors...</h3>
            <p className="text-gray-600">Processing customer feedback</p>
          </Card>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && analysis && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {analysis.totalMentions}
                    </div>
                    <div className="text-sm text-gray-600">Total Mentions</div>
                  </Card>
                  
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Object.keys(analysis.competitors).length}
                    </div>
                    <div className="text-sm text-gray-600">Competitors Tracked</div>
                  </Card>
                  
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {Object.keys(analysis.categories).length}
                    </div>
                    <div className="text-sm text-gray-600">Categories</div>
                  </Card>
                  
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {analysis.insights.length}
                    </div>
                    <div className="text-sm text-gray-600">Insights Generated</div>
                  </Card>
                </div>

                {/* Top Competitors */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Crown className="w-5 h-5 mr-2" />
                    Top Competitors
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(analysis.competitors)
                      .sort(([,a], [,b]) => b.totalMentions - a.totalMentions)
                      .slice(0, 5)
                      .map(([competitorId, competitor]) => (
                        <div key={competitorId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              {getCompetitorIcon(competitorId)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{competitor.name}</div>
                              <div className="text-sm text-gray-600">{competitor.totalMentions} mentions</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {competitor.avgSentiment > 0 ? '+' : ''}{competitor.avgSentiment.toFixed(2)}
                              </div>
                              <div className="text-xs text-gray-600">Sentiment</div>
                            </div>
                            
                            <div className="flex space-x-1">
                              <Badge variant="success" className="text-xs">
                                {competitor.sentimentPercentage.positive.toFixed(1)}%
                              </Badge>
                              <Badge variant="error" className="text-xs">
                                {competitor.sentimentPercentage.negative.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>

                {/* Recent Trends */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Recent Trends
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(analysis.trends).map(([period, trend]) => (
                      <div key={period} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {period.replace('_', ' ')}
                          </h4>
                          <Badge variant={trend.sentimentTrend === 'positive' ? 'success' : trend.sentimentTrend === 'negative' ? 'error' : 'default'}>
                            {trend.sentimentTrend}
                          </Badge>
                        </div>
                        
                        <div className="text-2xl font-bold text-green-600 mb-2">
                          {trend.totalMentions}
                        </div>
                        <div className="text-sm text-gray-600">mentions</div>
                        
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 mb-1">Top competitors:</div>
                          {trend.topCompetitors.map((top, index) => (
                            <div key={index} className="text-xs text-gray-600">
                              {top.name} ({top.count})
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'competitors' && analysis && (
              <div className="space-y-6">
                {/* Competitors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(analysis.competitors).map(([competitorId, competitor]) => (
                    <Card key={competitorId} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                            {getCompetitorIcon(competitorId)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{competitor.name}</h3>
                            <div className="text-sm text-gray-600">{competitor.totalMentions} mentions</div>
                          </div>
                        </div>
                        
                        <Badge variant={competitor.avgSentiment > 0 ? 'success' : competitor.avgSentiment < 0 ? 'error' : 'default'}>
                          {competitor.avgSentiment > 0 ? '+' : ''}{competitor.avgSentiment.toFixed(2)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Positive</span>
                          <span className="font-medium text-green-600">
                            {competitor.sentimentPercentage.positive.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${competitor.sentimentPercentage.positive}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Negative</span>
                          <span className="font-medium text-red-600">
                            {competitor.sentimentPercentage.negative.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${competitor.sentimentPercentage.negative}%` }}
                          ></div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'categories' && analysis && (
              <div className="space-y-6">
                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(analysis.categories).map(([categoryId, category]) => (
                    <Card key={categoryId} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            {getCategoryIcon(categoryId)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{category.name}</h3>
                            <div className="text-sm text-gray-600">{category.totalMentions} mentions</div>
                          </div>
                        </div>
                        
                        <Badge variant={category.avgSentiment > 0 ? 'success' : category.avgSentiment < 0 ? 'error' : 'default'}>
                          {category.avgSentiment > 0 ? '+' : ''}{category.avgSentiment.toFixed(2)}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Competitors in category:</div>
                        {category.competitors.slice(0, 3).map((competitorId) => {
                          const competitor = analysis.competitors[competitorId];
                          return competitor ? (
                            <div key={competitorId} className="flex items-center justify-between text-sm">
                              <span>{competitor.name}</span>
                              <span className="text-gray-600">{competitor.totalMentions}</span>
                            </div>
                          ) : null;
                        })}
                        {category.competitors.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{category.competitors.length - 3} more
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'mentions' && (
              <div className="space-y-6">
                {/* Mentions List */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Recent Mentions
                  </h3>
                  
                  <div className="space-y-4">
                    {mentions
                      .filter(mention => !selectedCompetitor || mention.competitor === selectedCompetitor)
                      .slice(0, 20)
                      .map((mention) => (
                        <div key={mention.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center">
                              <Badge variant={getSentimentColor(mention.sentiment)} className="mr-2">
                                {getSentimentIcon(mention.sentiment)}
                                {mention.sentiment}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                {mention.customerName} • {new Date(mention.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <Badge variant="default" className="text-xs">
                              {mention.competitor.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          
                          <div className="text-sm text-gray-900 mb-2">
                            "{mention.context}"
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            Keyword: <strong>{mention.keyword}</strong>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'insights' && analysis && (
              <div className="space-y-6">
                {/* Insights */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Key Insights
                  </h3>
                  
                  <div className="space-y-4">
                    {analysis.insights.map((insight, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{insight.title}</h4>
                          <Badge variant={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Zap className="w-3 h-3 mr-1" />
                          {insight.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recommendations */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Recommendations
                  </h3>
                  
                  <div className="space-y-4">
                    {analysis.recommendations.map((recommendation, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                          <div className="flex space-x-2">
                            <Badge variant={getPriorityColor(recommendation.priority)}>
                              {recommendation.priority}
                            </Badge>
                            <Badge variant="default">
                              {recommendation.impact}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{recommendation.description}</p>
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <Target className="w-3 h-3 mr-1" />
                          {recommendation.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 