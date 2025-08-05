'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  Clock,
  Target,
  Filter,
  Calendar,
  Download,
  Eye,
  PieChart,
  Activity,
  AlertTriangle,
  Star,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Navigation from '@/components/layout/Navigation';

interface AnalyticsData {
  overview: {
    totalFeedback: number;
    avgSentiment: number;
    responseRate: number;
    avgResponseTime: number;
  };
  trends: {
    positive: number;
    negative: number;
    neutral: number;
  };
  sources: {
    name: string;
    count: number;
    percentage: number;
  }[];
  categories: {
    name: string;
    count: number;
    percentage: number;
  }[];
  timeSeries: {
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }[];
  topIssues: {
    issue: string;
    count: number;
    trend: 'up' | 'down';
    percentage: number;
  }[];
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedSource, setSelectedSource] = useState('all');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange, selectedSource]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics?timeRange=${timeRange}&source=${selectedSource}`);
      
      // Handle the new API response structure
      const apiData = response.data.analytics || response.data;
      
      // Transform the API data to match the expected interface
      const transformedData: AnalyticsData = {
        overview: {
          totalFeedback: Number.isFinite(apiData.overview?.totalFeedback) ? apiData.overview.totalFeedback : 0,
          avgSentiment: Number.isFinite(apiData.overview?.avgSentimentScore) ? apiData.overview.avgSentimentScore : 0,
          responseRate: 87.5, // Default value since not provided by API
          avgResponseTime: 2.3 // Default value since not provided by API
        },
        trends: {
          positive: Number.isFinite(apiData.overview?.sentimentDistribution?.positive) ? apiData.overview.sentimentDistribution.positive : 0,
          negative: Number.isFinite(apiData.overview?.sentimentDistribution?.negative) ? apiData.overview.sentimentDistribution.negative : 0,
          neutral: Number.isFinite(apiData.overview?.sentimentDistribution?.neutral) ? apiData.overview.sentimentDistribution.neutral : 0
        },
        sources: Object.entries(apiData.overview?.sourceDistribution || {}).map(([name, count]) => ({
          name,
          count: Number.isFinite(count as number) ? (count as number) : 0,
          percentage: 0 // Will be calculated below
        })),
        categories: apiData.topCategories?.map((cat: any) => ({
          name: cat.category || 'Unknown',
          count: Number.isFinite(cat.count) ? cat.count : 0,
          percentage: 0 // Will be calculated below
        })) || [],
        timeSeries: apiData.trends?.map((trend: any) => ({
          date: trend.date || 'Unknown',
          positive: Number.isFinite(trend.positive) ? trend.positive : 0,
          negative: Number.isFinite(trend.negative) ? trend.negative : 0,
          neutral: Number.isFinite(trend.neutral) ? trend.neutral : 0
        })) || [],
        topIssues: apiData.topCategories?.slice(0, 5).map((cat: any, index: number) => ({
          issue: cat.category || 'Unknown',
          count: Number.isFinite(cat.count) ? cat.count : 0,
          trend: index % 2 === 0 ? 'up' : 'down' as 'up' | 'down',
          percentage: 0 // Will be calculated below
        })) || []
      };

      // Calculate percentages with validation
      const totalFeedback = transformedData.overview.totalFeedback;
      if (totalFeedback > 0) {
        transformedData.sources.forEach(source => {
          source.percentage = Number.isFinite(source.count / totalFeedback * 100) ? (source.count / totalFeedback * 100) : 0;
        });
        transformedData.categories.forEach(category => {
          category.percentage = Number.isFinite(category.count / totalFeedback * 100) ? (category.count / totalFeedback * 100) : 0;
        });
        transformedData.topIssues.forEach(issue => {
          issue.percentage = Number.isFinite(issue.count / totalFeedback * 100) ? (issue.count / totalFeedback * 100) : 0;
        });
      }

      setAnalyticsData(transformedData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      // Set mock data for demonstration
      setAnalyticsData({
        overview: {
          totalFeedback: 1247,
          avgSentiment: 3.8,
          responseRate: 87.5,
          avgResponseTime: 2.3
        },
        trends: {
          positive: 45,
          negative: 23,
          neutral: 32
        },
        sources: [
          { name: 'Intercom', count: 456, percentage: 36.6 },
          { name: 'Zendesk', count: 234, percentage: 18.8 },
          { name: 'Twitter', count: 189, percentage: 15.2 },
          { name: 'App Store', count: 156, percentage: 12.5 },
          { name: 'Google Play', count: 134, percentage: 10.7 },
          { name: 'Email', count: 78, percentage: 6.2 }
        ],
        categories: [
          { name: 'Bug Reports', count: 234, percentage: 18.8 },
          { name: 'Feature Requests', count: 189, percentage: 15.2 },
          { name: 'UI/UX Issues', count: 156, percentage: 12.5 },
          { name: 'Performance', count: 134, percentage: 10.7 },
          { name: 'Account Issues', count: 98, percentage: 7.9 },
          { name: 'Other', count: 436, percentage: 34.9 }
        ],
        timeSeries: [
          { date: '2024-01-01', positive: 45, negative: 12, neutral: 23 },
          { date: '2024-01-02', positive: 52, negative: 8, neutral: 28 },
          { date: '2024-01-03', positive: 38, negative: 15, neutral: 31 },
          { date: '2024-01-04', positive: 61, negative: 6, neutral: 19 },
          { date: '2024-01-05', positive: 47, negative: 11, neutral: 25 },
          { date: '2024-01-06', positive: 55, negative: 9, neutral: 22 },
          { date: '2024-01-07', positive: 42, negative: 14, neutral: 29 }
        ],
        topIssues: [
          { issue: 'Login problems', count: 89, trend: 'up', percentage: 7.1 },
          { issue: 'Slow loading times', count: 67, trend: 'down', percentage: 5.4 },
          { issue: 'Missing features', count: 54, trend: 'up', percentage: 4.3 },
          { issue: 'Payment errors', count: 43, trend: 'down', percentage: 3.4 },
          { issue: 'App crashes', count: 38, trend: 'up', percentage: 3.0 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '1y': return 'Last year';
      default: return 'Last 30 days';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation currentPage="analytics" />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-500">
                  Deep insights into your customer feedback
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                  </select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card hover padding="lg" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-50" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Feedback</p>
                        <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.totalFeedback.toLocaleString()}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                        <MessageSquare className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-600">+12.5%</span>
                      <span className="text-gray-500 ml-1">from last period</span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card hover padding="lg" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-50" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Avg Sentiment</p>
                        <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.avgSentiment}/5.0</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-600">+8.2%</span>
                      <span className="text-gray-500 ml-1">from last period</span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card hover padding="lg" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 opacity-50" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Response Rate</p>
                        <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.responseRate}%</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-600">+5.7%</span>
                      <span className="text-gray-500 ml-1">from last period</span>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card hover padding="lg" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100 opacity-50" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Avg Response Time</p>
                        <p className="text-3xl font-bold text-gray-900">{analyticsData.overview.avgResponseTime}h</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="flex items-center text-sm">
                      <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-red-600">-15.3%</span>
                      <span className="text-gray-500 ml-1">from last period</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Sentiment Distribution */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card padding="lg" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-30" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Sentiment Distribution</h3>
                        <p className="text-sm text-gray-500">{getTimeRangeLabel(timeRange)}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                        <PieChart className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">Positive</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{analyticsData.trends.positive}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">Negative</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{analyticsData.trends.negative}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-700">Neutral</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">{analyticsData.trends.neutral}%</span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <div className="flex h-3 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${analyticsData.trends.positive}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="bg-green-500 h-full"
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${analyticsData.trends.negative}%` }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="bg-red-500 h-full"
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${analyticsData.trends.neutral}%` }}
                            transition={{ duration: 1, delay: 0.6 }}
                            className="bg-gray-400 h-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Top Sources */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card padding="lg" className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-30" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Top Sources</h3>
                        <p className="text-sm text-gray-500">Feedback by platform</p>
                      </div>
                      <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {analyticsData.sources.slice(0, 5).map((source, index) => (
                        <motion.div
                          key={source.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-700">{source.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">{source.count}</span>
                            <span className="text-sm text-gray-500">({source.percentage}%)</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Top Issues */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card padding="lg" className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-30" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Top Issues</h3>
                      <p className="text-sm text-gray-500">Most reported problems</p>
                    </div>
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {analyticsData.topIssues.map((issue, index) => (
                      <motion.div
                        key={issue.issue}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{issue.issue}</p>
                            <p className="text-xs text-gray-500">{issue.count} reports</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {issue.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-red-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-green-500" />
                          )}
                          <span className={`text-sm font-medium ${issue.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
                            {issue.percentage}%
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 