'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  MessageSquare,
  AlertTriangle,
  Users,
  Activity,
  Clock,
  Star,
  Heart,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import Card from '@/components/ui/Card';

interface MetricsProps {
  metrics: {
    totalFeedback: number;
    sentimentScore: number;
    responseRate: number;
    avgResponseTime: number;
  };
}

const metricCards = [
  {
    key: 'totalFeedback',
    title: 'Total Feedback',
    subtitle: 'All time',
    icon: MessageSquare,
    color: 'blue',
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-blue-50 to-blue-100',
    format: (value: number) => value.toLocaleString(),
    trend: '+12.5%',
    trendDirection: 'up'
  },
  {
    key: 'sentimentScore',
    title: 'Sentiment Score',
    subtitle: 'Average rating',
    icon: Heart,
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    bgGradient: 'from-green-50 to-green-100',
    format: (value: number) => `${value.toFixed(1)}/5.0`,
    trend: '+8.2%',
    trendDirection: 'up'
  },
  {
    key: 'responseRate',
    title: 'Response Rate',
    subtitle: 'Customer satisfaction',
    icon: Target,
    color: 'purple',
    gradient: 'from-purple-500 to-purple-600',
    bgGradient: 'from-purple-50 to-purple-100',
    format: (value: number) => `${value.toFixed(1)}%`,
    trend: '+5.7%',
    trendDirection: 'up'
  },
  {
    key: 'avgResponseTime',
    title: 'Avg Response Time',
    subtitle: 'Hours to respond',
    icon: Zap,
    color: 'orange',
    gradient: 'from-orange-500 to-orange-600',
    bgGradient: 'from-orange-50 to-orange-100',
    format: (value: number) => `${value.toFixed(1)}h`,
    trend: '-15.3%',
    trendDirection: 'down'
  }
];

export default function DashboardMetrics({ metrics }: MetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricCards.map((card, index) => {
        const Icon = card.icon;
        const value = metrics[card.key as keyof typeof metrics];
        
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
          >
            <Card hover padding="lg" className="relative overflow-hidden">
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {card.format(value)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                
                {/* Trend indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    {card.trendDirection === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className={card.trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {card.trend}
                    </span>
                    <span className="text-gray-500 ml-1">from last period</span>
                  </div>
                  
                  {/* Mini chart indicator */}
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-${Math.floor(Math.random() * 4) + 2} rounded-full ${
                          card.trendDirection === 'up' ? 'bg-green-400' : 'bg-red-400'
                        }`}
                        style={{ height: `${Math.floor(Math.random() * 8) + 4}px` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
                <div className={`w-full h-full bg-gradient-to-br ${card.gradient} rounded-full blur-xl`} />
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
} 