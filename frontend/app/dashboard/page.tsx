'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  AlertTriangle,
  Users,
  Activity,
  BarChart3,
  Calendar,
  Filter,
  Plus,
  Settings,
  Bell
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Navigation from '@/components/layout/Navigation';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import SentimentChart from '@/components/dashboard/SentimentChart';
import RecentFeedback from '@/components/dashboard/RecentFeedback';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import TopCategories from '@/components/dashboard/TopCategories';
import WeeklyInsights from '@/components/dashboard/WeeklyInsights';

export default function Dashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [dashboardData, setDashboardData] = useState<{
    metrics: {
      totalFeedback: number;
      sentimentScore: number;
      responseRate: number;
      avgResponseTime: number;
    };
    trends: {
      positive: number;
      negative: number;
      neutral: number;
    };
    recentFeedback: any[];
    alerts: any[];
    topCategories: any[];
    weeklyInsights: any;
  }>({
    metrics: {
      totalFeedback: 0,
      sentimentScore: 0,
      responseRate: 0,
      avgResponseTime: 0
    },
    trends: {
      positive: 0,
      negative: 0,
      neutral: 0
    },
    recentFeedback: [],
    alerts: [],
    topCategories: [],
    weeklyInsights: null
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedSource, setSelectedSource] = useState('all');

  useEffect(() => {
    loadDashboardData();

    // Socket listeners for real-time updates
    if (socket) {
      socket.on('dashboard-update', (data) => {
        setDashboardData(prev => ({
          ...prev,
          ...data
        }));
      });

      socket.on('new-feedback', (feedback) => {
        setDashboardData(prev => ({
          ...prev,
          recentFeedback: [feedback, ...prev.recentFeedback.slice(0, 9)],
          metrics: {
            ...prev.metrics,
            totalFeedback: prev.metrics.totalFeedback + 1
          }
        }));
      });

      socket.on('sentiment-alert', (alert) => {
        setDashboardData(prev => ({
          ...prev,
          alerts: [alert, ...prev.alerts.slice(0, 4)]
        }));
      });
    }

    return () => {
      if (socket) {
        socket.off('dashboard-update');
        socket.off('new-feedback');
        socket.off('sentiment-alert');
      }
    };
  }, [socket, timeRange, selectedSource]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, analyticsRes, insightsRes] = await Promise.all([
        api.get('/dashboard/overview', { params: { timeRange, source: selectedSource } }),
        api.get('/analytics/trends', { params: { timeRange, source: selectedSource } }),
        api.get('/analytics/weekly-insights')
      ]);

      setDashboardData({
        metrics: {
          totalFeedback: overviewRes.data.overview.totalFeedback,
          sentimentScore: overviewRes.data.overview.avgSentimentScore,
          responseRate: overviewRes.data.overview.resolutionRate,
          avgResponseTime: 0 // Not available in current API
        },
        trends: analyticsRes.data.trends,
        recentFeedback: [], // Not available in current API
        alerts: [], // Not available in current API
        topCategories: overviewRes.data.overview.topSources || [],
        weeklyInsights: insightsRes.data.insights
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
  };

  const handleSourceFilter = (source: string) => {
    setSelectedSource(source);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation currentPage="dashboard" />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {user?.firstName || 'User'}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add Integration
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Settings className="h-4 w-4" />}
                  >
                    Settings
                  </Button>
                </div>

                {/* Time Range Filter */}
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <select
                    value={timeRange}
                    onChange={(e) => handleTimeRangeChange(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>

                {/* Source Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={selectedSource}
                    onChange={(e) => handleSourceFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="all">All Sources</option>
                    <option value="intercom">Intercom</option>
                    <option value="zendesk">Zendesk</option>
                    <option value="twitter">Twitter</option>
                    <option value="app_store">App Store</option>
                    <option value="google_play">Google Play</option>
                  </select>
                </div>
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
          {/* Metrics Cards */}
          <DashboardMetrics metrics={dashboardData.metrics} />

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <SentimentChart trends={dashboardData.trends} timeRange={timeRange} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <TopCategories categories={dashboardData.topCategories} />
            </motion.div>
          </div>

          {/* Recent Feedback and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2"
            >
              <RecentFeedback feedback={dashboardData.recentFeedback} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <AlertsPanel alerts={dashboardData.alerts} />
            </motion.div>
          </div>

          {/* Weekly Insights */}
          {dashboardData.weeklyInsights && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <WeeklyInsights insights={dashboardData.weeklyInsights} />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  </div>
);
} 