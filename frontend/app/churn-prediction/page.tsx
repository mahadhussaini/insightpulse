'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  Target,
  Activity,
  Users,
  Settings,
  HelpCircle,
  Frown,
  Clock,
  BarChart3,
  Shield,
  Lightbulb,
  Zap
} from 'lucide-react';

interface ChurnRisk {
  riskScore: number;
  riskLevel: string;
  retentionProbability: number;
  churnFactors: Array<{
    type: string;
    severity: string;
    description: string;
    count?: number;
  }>;
  predictions: Array<{
    type: string;
    prediction: string;
    confidence: string;
    timeframe?: string;
    actions?: string[];
    priority?: string;
  }>;
  metadata: {
    totalFeedback: number;
    timeRange: string;
    source: string;
    analysisDate: string;
  };
}

interface ChurnAnalytics {
  overallRisk: {
    score: number;
    level: string;
    trend: string;
  };
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  retentionMetrics: {
    averageRetentionProbability: number;
    predictedChurnRate: number;
    retentionTrend: string;
  };
}

interface ChurnRecommendation {
  priority: string;
  action: string;
  description: string;
  impact?: string;
  category?: string;
}

export default function ChurnPredictionPage() {
  const { user } = useAuth();
  const [churnRisk, setChurnRisk] = useState<ChurnRisk | null>(null);
  const [analytics, setAnalytics] = useState<ChurnAnalytics | null>(null);
  const [recommendations, setRecommendations] = useState<ChurnRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('90d');
  const [source, setSource] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadChurnData();
  }, [timeRange, source]);

  const loadChurnData = async () => {
    setIsLoading(true);
    try {
      const [riskResponse, analyticsResponse, recommendationsResponse] = await Promise.all([
        api.get('/churn-prediction/risk', {
          params: { timeRange, source, includeDetails: true }
        }),
        api.get('/churn-prediction/analytics', {
          params: { timeRange, source }
        }),
        api.get('/churn-prediction/recommendations', {
          params: { timeRange, source }
        })
      ]);

      setChurnRisk(riskResponse.data.data);
      setAnalytics(analyticsResponse.data.data.analytics);
      setRecommendations([
        ...recommendationsResponse.data.data.recommendations.immediate,
        ...recommendationsResponse.data.data.recommendations.high,
        ...recommendationsResponse.data.data.recommendations.medium
      ]);
    } catch (error) {
      console.error('Error loading churn data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getFactorIcon = (factorType: string) => {
    switch (factorType) {
      case 'negative_sentiment': return <Frown className="w-4 h-4" />;
      case 'decreasing_engagement': return <TrendingDown className="w-4 h-4" />;
      case 'support_issues': return <HelpCircle className="w-4 h-4" />;
      case 'feature_requests': return <Settings className="w-4 h-4" />;
      case 'competitor_mentions': return <Users className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access Churn Prediction</h1>
          <Button>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Churn Prediction
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Predict and prevent customer churn with AI-powered risk analysis. Get early warnings and actionable recommendations.
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
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="30d">Last 30 days</option>
                    <option value="60d">Last 60 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  >
                    <option value="all">All sources</option>
                    <option value="intercom">Intercom</option>
                    <option value="zendesk">Zendesk</option>
                    <option value="app_store">App Store</option>
                    <option value="google_play">Google Play</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Analyzing churn risk...</h3>
            <p className="text-gray-600">Processing your feedback data</p>
          </Card>
        )}

        {/* Main Content */}
        {!isLoading && churnRisk && (
          <div className="space-y-8">
            {/* Risk Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Risk Score */}
              <Card className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    {getRiskLevelIcon(churnRisk.riskLevel)}
                    <span className="ml-2 text-lg font-semibold capitalize">{churnRisk.riskLevel} Risk</span>
                  </div>
                  <div className="text-4xl font-bold text-red-600 mb-2">{churnRisk.riskScore}</div>
                  <div className="text-sm text-gray-500">Risk Score (0-100)</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${churnRisk.riskScore}%` }}
                    ></div>
                  </div>
                </div>
              </Card>

              {/* Retention Probability */}
              <Card className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <Shield className="w-5 h-5 mr-2" />
                    <span className="text-lg font-semibold">Retention Probability</span>
                  </div>
                  <div className="text-4xl font-bold text-green-600 mb-2">{churnRisk.retentionProbability.toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">Likelihood of staying</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${churnRisk.retentionProbability}%` }}
                    ></div>
                  </div>
                </div>
              </Card>

              {/* Feedback Analyzed */}
              <Card className="p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    <span className="text-lg font-semibold">Feedback Analyzed</span>
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-2">{churnRisk.metadata.totalFeedback}</div>
                  <div className="text-sm text-gray-500">Total feedback items</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {churnRisk.metadata.timeRange} • {churnRisk.metadata.source}
                  </div>
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: Target },
                  { id: 'factors', name: 'Churn Factors', icon: AlertTriangle },
                  { id: 'predictions', name: 'Predictions', icon: TrendingDown },
                  { id: 'recommendations', name: 'Recommendations', icon: Lightbulb }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-red-500 text-red-600'
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

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Distribution */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Risk Distribution
                      </h3>
                      {analytics && (
                        <div className="space-y-4">
                          {Object.entries(analytics.riskDistribution).map(([level, percentage]) => (
                            <div key={level} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Badge variant={getRiskLevelColor(level)} className="mr-3">
                                  {level.charAt(0).toUpperCase() + level.slice(1)}
                                </Badge>
                                <span className="text-sm text-gray-600">{percentage}%</span>
                              </div>
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    level === 'low' ? 'bg-green-500' :
                                    level === 'medium' ? 'bg-yellow-500' :
                                    level === 'high' ? 'bg-orange-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>

                    {/* Retention Metrics */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Retention Metrics
                      </h3>
                      {analytics && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Average Retention</span>
                            <span className="font-semibold text-green-600">
                              {analytics.retentionMetrics.averageRetentionProbability.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Predicted Churn Rate</span>
                            <span className="font-semibold text-red-600">
                              {analytics.retentionMetrics.predictedChurnRate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Trend</span>
                            <Badge variant={analytics.retentionMetrics.retentionTrend === 'improving' ? 'success' : 'warning'}>
                              {analytics.retentionMetrics.retentionTrend}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                )}

                {activeTab === 'factors' && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Churn Factors
                    </h3>
                    <div className="space-y-4">
                      {churnRisk.churnFactors.map((factor, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              {getFactorIcon(factor.type)}
                              <span className="ml-2 font-medium text-gray-900">
                                {factor.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <Badge variant={getSeverityColor(factor.severity)}>
                              {factor.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{factor.description}</p>
                          {factor.count && (
                            <div className="mt-2 text-xs text-gray-500">
                              Count: {factor.count}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {activeTab === 'predictions' && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <TrendingDown className="w-5 h-5 mr-2" />
                      Churn Predictions
                    </h3>
                    <div className="space-y-4">
                      {churnRisk.predictions.map((prediction, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{prediction.prediction}</span>
                            <Badge variant={prediction.confidence === 'high' ? 'error' : prediction.confidence === 'medium' ? 'warning' : 'success'}>
                              {prediction.confidence} confidence
                            </Badge>
                          </div>
                          {prediction.timeframe && (
                            <p className="text-sm text-gray-600 mb-2">Timeframe: {prediction.timeframe}</p>
                          )}
                          {prediction.actions && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700 mb-1">Recommended Actions:</p>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {prediction.actions.map((action, actionIndex) => (
                                  <li key={actionIndex} className="flex items-center">
                                    <Zap className="w-3 h-3 mr-2 text-yellow-500" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {activeTab === 'recommendations' && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Prevention Recommendations
                    </h3>
                    <div className="space-y-4">
                      {recommendations.map((recommendation, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{recommendation.action}</span>
                            <Badge variant={recommendation.priority === 'critical' ? 'error' : recommendation.priority === 'high' ? 'warning' : 'success'}>
                              {recommendation.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{recommendation.description}</p>
                          {recommendation.impact && (
                            <div className="mt-2">
                              <Badge variant="default" className="text-xs">
                                Impact: {recommendation.impact}
                              </Badge>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !churnRisk && (
          <Card className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Churn Data Available</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Adjust your filters or add more feedback data to see churn predictions and risk analysis.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
} 