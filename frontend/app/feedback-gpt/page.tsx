'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Search, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Star,
  History,
  Lightbulb
} from 'lucide-react';

interface QuerySuggestion {
  query: string;
  reason: string;
}

interface PredefinedQuery {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface GPTResponse {
  query: string;
  response: string;
  insights: string[];
  recommendations: string[];
  confidence: 'high' | 'medium' | 'low';
  dataPoints: {
    totalFeedback: number;
    positiveCount: number;
    negativeCount: number;
    topSources: string[];
    topCategories: string[];
  };
  metadata: {
    totalFeedback: number;
    timeRange: string;
    source: string;
    processingTime: number;
  };
}

export default function FeedbackGPTPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<GPTResponse | null>(null);
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
  const [predefinedQueries, setPredefinedQueries] = useState<PredefinedQuery[]>([]);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [timeRange, setTimeRange] = useState('30d');
  const [source, setSource] = useState('all');

  useEffect(() => {
    loadSuggestions();
    loadPredefinedQueries();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await api.get('/feedback-gpt/suggestions');
      setSuggestions(response.data.data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadPredefinedQueries = async () => {
    try {
      const response = await api.get('/feedback-gpt/predefined');
      setPredefinedQueries(response.data.data);
    } catch (error) {
      console.error('Error loading predefined queries:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      const response = await api.post('/feedback-gpt/query', {
        query: query.trim(),
        timeRange,
        source,
        limit: 100,
        includeRawData: false
      });

      setResponse(response.data.data);
      setQueryHistory(prev => [query.trim(), ...prev.slice(0, 9)]);
    } catch (error) {
      console.error('Error processing query:', error);
      setResponse({
        query: query.trim(),
        response: 'Sorry, I encountered an error while processing your query. Please try again.',
        insights: ['Error occurred during processing'],
        recommendations: ['Check your connection and try again'],
        confidence: 'low',
        dataPoints: {
          totalFeedback: 0,
          positiveCount: 0,
          negativeCount: 0,
          topSources: [],
          topCategories: []
        },
        metadata: {
          totalFeedback: 0,
          timeRange,
          source,
          processingTime: 0
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredefinedQuery = (predefinedQuery: PredefinedQuery) => {
    setQuery(predefinedQuery.title);
  };

  const handleSuggestionClick = (suggestion: QuerySuggestion) => {
    setQuery(suggestion.query);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access Feedback GPT</h1>
          <Button>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Feedback GPT
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ask AI anything about your customer feedback. Get instant insights, patterns, and actionable recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar */}
          <div className="space-y-6">
            {/* Query Form */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Ask Your Question
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., Why are users uninstalling our app?"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                    <select
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All sources</option>
                      <option value="intercom">Intercom</option>
                      <option value="zendesk">Zendesk</option>
                      <option value="app_store">App Store</option>
                      <option value="google_play">Google Play</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Ask AI
                    </>
                  )}
                </Button>
              </form>
            </Card>

            {/* Quick Suggestions */}
            {suggestions.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Smart Suggestions
                </h3>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{suggestion.query}</div>
                      <div className="text-sm text-gray-500">{suggestion.reason}</div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Query History */}
            {queryHistory.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Recent Queries
                </h3>
                <div className="space-y-2">
                  {queryHistory.map((historyQuery, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(historyQuery)}
                      className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
                    >
                      {historyQuery}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Predefined Queries */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Star className="w-5 h-5 mr-2" />
                Popular Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {predefinedQueries.map((predefinedQuery) => (
                  <button
                    key={predefinedQuery.id}
                    onClick={() => handlePredefinedQuery(predefinedQuery)}
                    className="text-left p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <div className="font-medium text-gray-900 mb-1">{predefinedQuery.title}</div>
                    <div className="text-sm text-gray-500">{predefinedQuery.description}</div>
                    <Badge variant="success" className="mt-2">
                      {predefinedQuery.category}
                    </Badge>
                  </button>
                ))}
              </div>
            </Card>

            {/* AI Response */}
            <AnimatePresence>
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        AI Analysis
                      </h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getConfidenceColor(response.confidence)}>
                          {getConfidenceIcon(response.confidence)}
                          {response.confidence} confidence
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {response.metadata.totalFeedback} feedback items analyzed
                        </div>
                      </div>
                    </div>

                    <div className="prose max-w-none">
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="text-sm text-gray-500 mb-2">Your Question:</div>
                        <div className="font-medium text-gray-900">{response.query}</div>
                      </div>

                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Answer</h4>
                        <div className="text-gray-700 leading-relaxed">{response.response}</div>
                      </div>

                      {response.insights && response.insights.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Key Insights
                          </h4>
                          <ul className="space-y-2">
                            {response.insights.map((insight, index) => (
                              <li key={index} className="flex items-start">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <span className="text-gray-700">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {response.recommendations && response.recommendations.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Recommendations
                          </h4>
                          <ul className="space-y-2">
                            {response.recommendations.map((recommendation, index) => (
                              <li key={index} className="flex items-start">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                <span className="text-gray-700">{recommendation}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{response.dataPoints.totalFeedback}</div>
                          <div className="text-sm text-gray-500">Total Feedback</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{response.dataPoints.positiveCount}</div>
                          <div className="text-sm text-gray-500">Positive</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{response.dataPoints.negativeCount}</div>
                          <div className="text-sm text-gray-500">Negative</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{response.metadata.processingTime}ms</div>
                          <div className="text-sm text-gray-500">Processing Time</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty State */}
            {!response && !isLoading && (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Ask AI?</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Start by asking a question about your customer feedback. Try one of the popular questions above or type your own.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 