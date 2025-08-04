'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Bell, Clock, X, CheckCircle } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface Alert {
  id: string;
  type: 'sentiment_spike' | 'urgent_feedback' | 'integration_error' | 'sync_failed' | 'system_notification';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  timestamp: string;
  metadata?: any;
}

interface AlertsPanelProps {
  alerts: Alert[];
}



const getAlertIcon = (type: string) => {
  switch (type) {
    case 'sentiment_spike': return '📈';
    case 'urgent_feedback': return '🚨';
    case 'integration_error': return '🔌';
    case 'sync_failed': return '🔄';
    case 'system_notification': return 'ℹ️';
    default: return '🔔';
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
  
  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${Math.floor(diffInMinutes)}m ago`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  const unreadAlerts = alerts.filter(alert => !alert.isRead);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card padding="md">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Alerts</h3>
          <p className="text-sm text-gray-500">
            {unreadAlerts.length} unread, {criticalAlerts.length} critical
          </p>
        </div>
        <Bell className="h-6 w-6 text-gray-400" />
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
            <p className="text-gray-500">All clear!</p>
            <p className="text-sm text-gray-400">No alerts at the moment</p>
          </div>
        ) : (
          alerts.slice(0, 5).map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`border rounded-lg p-3 ${
                alert.isRead 
                  ? 'border-gray-100 bg-gray-50' 
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-lg">{getAlertIcon(alert.type)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      alert.isRead ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {alert.title}
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                                                  <Badge variant="default" size="sm">
                              {alert.severity}
                            </Badge>
                      
                      {!alert.isRead && (
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                  </div>
                  
                  <p className={`text-sm mt-1 ${
                    alert.isRead ? 'text-gray-500' : 'text-gray-700'
                  }`}>
                    {alert.message}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimestamp(alert.timestamp)}
                    </span>
                    
                    {!alert.isRead && (
                      <button className="text-xs text-blue-600 hover:text-blue-700">
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {alerts.length > 5 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View all alerts ({alerts.length})
          </button>
        </div>
      )}
    </Card>
  </motion.div>
);
} 