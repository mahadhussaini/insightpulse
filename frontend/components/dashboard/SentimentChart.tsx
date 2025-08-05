'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Smile, Frown, Meh } from 'lucide-react';
import Card from '@/components/ui/Card';

interface SentimentChartProps {
  trends: {
    positive: number;
    negative: number;
    neutral: number;
  };
  timeRange: string;
}

export default function SentimentChart({ trends, timeRange }: SentimentChartProps) {
  // Validate and sanitize input data
  const safeTrends = {
    positive: Number.isFinite(trends.positive) ? trends.positive : 0,
    negative: Number.isFinite(trends.negative) ? trends.negative : 0,
    neutral: Number.isFinite(trends.neutral) ? trends.neutral : 0
  };

  const total = safeTrends.positive + safeTrends.negative + safeTrends.neutral;
  const positivePercentage = total > 0 ? (safeTrends.positive / total) * 100 : 0;
  const negativePercentage = total > 0 ? (safeTrends.negative / total) * 100 : 0;
  const neutralPercentage = total > 0 ? (safeTrends.neutral / total) * 100 : 0;

  // Ensure percentages are valid numbers
  const safePositivePercentage = Number.isFinite(positivePercentage) ? positivePercentage : 0;
  const safeNegativePercentage = Number.isFinite(negativePercentage) ? negativePercentage : 0;
  const safeNeutralPercentage = Number.isFinite(neutralPercentage) ? neutralPercentage : 0;

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '24h': return 'Last 24 hours';
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Last 7 days';
    }
  };

  const sentimentItems = [
    {
      type: 'positive',
      label: 'Positive',
      value: safeTrends.positive,
      percentage: safePositivePercentage,
      icon: Smile,
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100'
    },
    {
      type: 'negative',
      label: 'Negative',
      value: safeTrends.negative,
      percentage: safeNegativePercentage,
      icon: Frown,
      color: 'red',
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-red-100'
    },
    {
      type: 'neutral',
      label: 'Neutral',
      value: safeTrends.neutral,
      percentage: safeNeutralPercentage,
      icon: Meh,
      color: 'gray',
      gradient: 'from-gray-500 to-gray-600',
      bgGradient: 'from-gray-50 to-gray-100'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
    >
      <Card padding="lg" className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-30" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Sentiment Trends</h3>
              <p className="text-sm text-gray-500">{getTimeRangeLabel(timeRange)}</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="space-y-6">
            {sentimentItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${item.bgGradient}`}>
                        <Icon className={`h-4 w-4 text-${item.color}-600`} />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{item.value} feedback</span>
                          <span className="text-xs font-medium text-gray-600">({item.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Percentage indicator */}
                    <div className="text-right">
                      <div className={`text-lg font-bold text-${item.color}-600`}>
                        {item.percentage.toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="relative">
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                        className={`h-full bg-gradient-to-r ${item.gradient} rounded-full relative`}
                      >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
                      </motion.div>
                    </div>
                    
                    {/* Progress bar glow */}
                    <div className={`absolute inset-0 h-3 bg-gradient-to-r ${item.gradient} rounded-full opacity-20 blur-sm`} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Total Feedback</span>
              <span className="text-lg font-bold text-gray-900">{total}</span>
            </div>
            
            {/* Trend indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                {safePositivePercentage > safeNegativePercentage ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={safePositivePercentage > safeNegativePercentage ? 'text-green-600' : 'text-red-600'}>
                  {safePositivePercentage > safeNegativePercentage ? 'Improving' : 'Declining'}
                </span>
                <span className="text-gray-500 ml-1">sentiment trend</span>
              </div>
              
              {/* Sentiment score */}
              <div className="flex items-center space-x-2">
                <div className="text-xs text-gray-500">Overall Score:</div>
                <div className="px-2 py-1 rounded-full bg-gradient-to-r from-green-100 to-blue-100">
                  <span className="text-sm font-semibold text-gray-700">
                    {safePositivePercentage > safeNegativePercentage ? 'Positive' : 'Needs Attention'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-16 h-16 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl" />
        </div>
      </Card>
    </motion.div>
  );
} 