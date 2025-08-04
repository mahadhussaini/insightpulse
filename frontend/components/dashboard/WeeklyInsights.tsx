'use client';

import { motion } from 'framer-motion';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';

interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'trend' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category?: string;
  data?: any;
}

interface WeeklyInsightsProps {
  insights: {
    summary: string;
    keyInsights: Insight[];
    recommendations: string[];
    trends: {
      positive: string[];
      negative: string[];
      neutral: string[];
    };
  };
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'positive': return '✅';
    case 'negative': return '⚠️';
    case 'neutral': return 'ℹ️';
    case 'trend': return '📈';
    case 'recommendation': return '💡';
    default: return '🔍';
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'text-red-600 bg-red-50 border-red-200';
    case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'low': return 'text-green-600 bg-green-50 border-green-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export default function WeeklyInsights({ insights }: WeeklyInsightsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card padding="md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Weekly Insights</h3>
          <p className="text-sm text-gray-500">AI-generated analysis of your feedback</p>
        </div>
        <Lightbulb className="h-6 w-6 text-gray-400" />
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Executive Summary</h4>
        <p className="text-sm text-blue-800">{insights.summary}</p>
      </div>

      {/* Key Insights */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Key Insights</h4>
        
        {insights.keyInsights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <span className="text-lg">{getInsightIcon(insight.type)}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-gray-900">{insight.title}</h5>
                <span className={`text-xs px-2 py-1 rounded-full border ${getImpactColor(insight.impact)}`}>
                  {insight.impact} impact
                </span>
              </div>
              
              <p className="text-sm text-gray-600">{insight.description}</p>
              
              {insight.category && (
                <div className="mt-2">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {insight.category}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trends */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Positive Trends */}
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <h5 className="text-sm font-medium text-green-900">Positive Trends</h5>
          </div>
          <ul className="space-y-2">
            {insights.trends.positive.map((trend, index) => (
              <li key={index} className="text-xs text-green-800 flex items-start space-x-2">
                <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{trend}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Negative Trends */}
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <h5 className="text-sm font-medium text-red-900">Areas of Concern</h5>
          </div>
          <ul className="space-y-2">
            {insights.trends.negative.map((trend, index) => (
              <li key={index} className="text-xs text-red-800 flex items-start space-x-2">
                <AlertTriangle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                <span>{trend}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Neutral Trends */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <div className="h-4 w-4 text-gray-600">📊</div>
            <h5 className="text-sm font-medium text-gray-900">Neutral Observations</h5>
          </div>
          <ul className="space-y-2">
            {insights.trends.neutral.map((trend, index) => (
              <li key={index} className="text-xs text-gray-700 flex items-start space-x-2">
                <div className="h-3 w-3 text-gray-500 mt-0.5 flex-shrink-0">•</div>
                <span>{trend}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-yellow-800">{recommendation}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </Card>
  </motion.div>
);
} 