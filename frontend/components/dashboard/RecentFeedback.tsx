'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Clock, User, Tag, ExternalLink, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface Feedback {
  id: string;
  content: string;
  source: string;
  author: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  categories: string[];
  tags: string[];
}

interface RecentFeedbackProps {
  feedback: Feedback[];
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case 'intercom': return '💬';
    case 'zendesk': return '🎫';
    case 'twitter': return '🐦';
    case 'app_store': return '🍎';
    case 'google_play': return '🤖';
    default: return '📝';
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case 'intercom': return 'from-blue-500 to-blue-600';
    case 'zendesk': return 'from-green-500 to-green-600';
    case 'twitter': return 'from-sky-500 to-sky-600';
    case 'app_store': return 'from-gray-500 to-gray-600';
    case 'google_play': return 'from-green-500 to-green-600';
    default: return 'from-purple-500 to-purple-600';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return 'Just now';
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default function RecentFeedback({ feedback }: RecentFeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
    >
      <Card padding="lg" className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-30" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Recent Feedback</h3>
              <p className="text-sm text-gray-500">Latest customer feedback from all sources</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="space-y-6">
            {feedback.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium mb-2">No feedback yet</p>
                <p className="text-sm text-gray-400">Feedback will appear here as it comes in</p>
              </motion.div>
            ) : (
              feedback.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    transition: { duration: 0.2 }
                  }}
                  className="relative group"
                >
                  <div className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-200 bg-white">
                    {/* Source header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${getSourceColor(item.source)} shadow-md`}>
                          <span className="text-white text-sm">{getSourceIcon(item.source)}</span>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-gray-700 capitalize">
                            {item.source.replace('_', ' ')}
                          </span>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(item.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sentiment indicator */}
                      <div className="flex items-center space-x-2">
                        {item.sentiment === 'positive' && (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        )}
                        {item.sentiment === 'negative' && (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        {item.urgency === 'critical' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <p className="text-gray-900 leading-relaxed line-clamp-3">{item.content}</p>
                    </div>

                    {/* Author and badges */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{item.author}</span>
                        </div>
                        
                        {/* Sentiment Badge */}
                        <Badge variant="sentiment" sentiment={item.sentiment} size="sm">
                          {item.sentiment}
                        </Badge>

                        {/* Urgency Badge */}
                        <Badge variant="urgency" urgency={item.urgency} size="sm">
                          {item.urgency}
                        </Badge>
                      </div>

                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center group-hover:scale-105 transition-transform">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </button>
                    </div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <div className="flex flex-wrap gap-2">
                          {item.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200"
                            >
                              {tag}
                            </span>
                          ))}
                          {item.tags.length > 3 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              +{item.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {feedback.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-8 pt-6 border-t border-gray-200"
            >
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center group">
                View all feedback 
                <ExternalLink className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-16 h-16 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl" />
        </div>
      </Card>
    </motion.div>
  );
} 