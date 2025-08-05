'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Lightbulb, Target, BarChart3, Users, Clock, Zap } from 'lucide-react';

interface WeeklyInsightsProps {
  insights: {
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    metrics?: {
      customerSatisfaction: string;
      responseTime: string;
      issueResolution: string;
    };
  };
}

const getInsightIcon = (type: string) => {
  switch (type) {
    case 'volume': return <BarChart3 className="h-4 w-4 text-blue-600" />;
    case 'sentiment': return <Users className="h-4 w-4 text-green-600" />;
    case 'trend': return <TrendingUp className="h-4 w-4 text-purple-600" />;
    case 'recommendation': return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    case 'metric': return <Target className="h-4 w-4 text-indigo-600" />;
    default: return <Zap className="h-4 w-4 text-gray-600" />;
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'bg-red-100 text-red-800 border-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function WeeklyInsights({ insights }: WeeklyInsightsProps) {
  if (!insights) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>Loading weekly insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      {/* Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Weekly Summary</h3>
        <p className="text-gray-600 leading-relaxed">{insights.summary}</p>
      </div>

      {/* Key Findings */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Key Findings</h4>
        
        {insights.keyFindings && insights.keyFindings.map((finding, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0">
              <span className="text-lg">{getInsightIcon('metric')}</span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h5 className="text-sm font-medium text-gray-900">Finding {index + 1}</h5>
                <span className="text-xs px-2 py-1 rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                  Medium impact
                </span>
              </div>
              
              <p className="text-sm text-gray-600">{finding}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Metrics */}
      {insights.metrics && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer Satisfaction */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-4 w-4 text-green-600" />
              <h5 className="text-sm font-medium text-green-900">Customer Satisfaction</h5>
            </div>
            <p className="text-xs text-green-800 capitalize">{insights.metrics.customerSatisfaction}</p>
          </div>

          {/* Response Time */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-blue-600" />
              <h5 className="text-sm font-medium text-blue-900">Response Time</h5>
            </div>
            <p className="text-xs text-blue-800 capitalize">{insights.metrics.responseTime.replace('_', ' ')}</p>
          </div>

          {/* Issue Resolution */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2 mb-3">
              <Target className="h-4 w-4 text-purple-600" />
              <h5 className="text-sm font-medium text-purple-900">Issue Resolution</h5>
            </div>
            <p className="text-xs text-purple-800 capitalize">{insights.metrics.issueResolution.replace('_', ' ')}</p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations && insights.recommendations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h4>
          <div className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-start space-x-3 p-3 rounded-lg border border-yellow-100 bg-yellow-50"
              >
                <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-yellow-800">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 