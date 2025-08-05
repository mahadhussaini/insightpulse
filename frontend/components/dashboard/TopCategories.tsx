'use client';

import { motion } from 'framer-motion';
import { Tag, TrendingUp, TrendingDown } from 'lucide-react';
import Card from '@/components/ui/Card';

interface Category {
  name: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface TopCategoriesProps {
  categories: Category[];
}

const getCategoryIcon = (name: string) => {
  const categoryIcons: { [key: string]: string } = {
    'bugs': '🐛',
    'feature_request': '💡',
    'pricing': '💰',
    'onboarding': '🚀',
    'performance': '⚡',
    'ui_ux': '🎨',
    'support': '🆘',
    'billing': '💳',
    'mobile': '📱',
    'desktop': '💻',
    'api': '🔌',
    'security': '🔒',
    'documentation': '📚',
    'integration': '🔗',
    'email': '📧',
    'notifications': '🔔'
  };
  
  return categoryIcons[name.toLowerCase()] || '🏷️';
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return 'text-green-600';
    case 'negative': return 'text-red-600';
    case 'neutral': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

const getTrendColor = (trend: string) => {
  switch (trend) {
    case 'up': return 'text-green-600';
    case 'down': return 'text-red-600';
    case 'stable': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

export default function TopCategories({ categories }: TopCategoriesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card padding="md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
          <p className="text-sm text-gray-500">Most common feedback themes</p>
        </div>
        <Tag className="h-6 w-6 text-gray-400" />
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No categories yet</p>
            <p className="text-sm text-gray-400">Categories will appear as feedback is analyzed</p>
          </div>
        ) : (
          categories.slice(0, 8).map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getCategoryIcon(category.name)}</span>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 capitalize">
                    {category.name.replace('_', ' ')}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs ${getSentimentColor(category.sentiment)}`}>
                      {category.sentiment}
                    </span>
                    <span className="text-xs text-gray-500">
                      {category.count} feedback
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {Number.isFinite(category.percentage) ? category.percentage.toFixed(1) : '0.0'}%
                  </span>
                  
                  <div className="flex items-center mt-1">
                    {category.trend === 'up' ? (
                      <TrendingUp className={`h-3 w-3 ${getTrendColor(category.trend)} mr-1`} />
                    ) : category.trend === 'down' ? (
                      <TrendingDown className={`h-3 w-3 ${getTrendColor(category.trend)} mr-1`} />
                    ) : (
                      <div className="w-3 h-3 mr-1"></div>
                    )}
                    <span className={`text-xs ${getTrendColor(category.trend)}`}>
                      {category.trend === 'up' ? '+' : category.trend === 'down' ? '-' : ''}
                      {category.trend !== 'stable' ? '5%' : 'stable'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Number.isFinite(category.percentage) ? category.percentage : 0}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className={`h-full ${
                      category.sentiment === 'positive' 
                        ? 'bg-green-500' 
                        : category.sentiment === 'negative'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    }`}
                  />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {categories.length > 8 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View all categories ({categories.length})
          </button>
        </div>
      )}
    </Card>
  </motion.div>
);
} 