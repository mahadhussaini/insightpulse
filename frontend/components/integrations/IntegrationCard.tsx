'use client';

import { motion } from 'framer-motion';
import {
  Settings,
  TestTube,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MoreVertical
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string | null;
  config: any;
  stats: {
    totalItems: number;
    lastSyncItems: number;
    avgResponseTime: number | null;
    satisfactionScore: number | null;
  };
  errorMessage?: string;
}

interface IntegrationCardProps {
  integration: Integration;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
  onSync: () => void;
  syncing: boolean;
}

const getIntegrationIcon = (type: string) => {
  switch (type) {
    case 'intercom': return '💬';
    case 'zendesk': return '🎫';
    case 'twitter': return '🐦';
    case 'app_store': return '🍎';
    case 'google_play': return '🤖';
    case 'webhook': return '🔗';
    default: return '🔌';
  }
};



const formatTimestamp = (timestamp: string | null) => {
  if (!timestamp) return 'Never';
  
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

export default function IntegrationCard({ 
  integration, 
  onEdit, 
  onDelete, 
  onTest, 
  onSync, 
  syncing 
}: IntegrationCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
    >
      <Card hover padding="md">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getIntegrationIcon(integration.type)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{integration.name}</h3>
            <p className="text-sm text-gray-500 capitalize">
              {integration.type.replace('_', ' ')}
            </p>
          </div>
        </div>
        
                        <div className="flex items-center space-x-2">
                  <Badge variant="status" status={integration.status} size="sm">
                    {integration.status}
                  </Badge>
                </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500">Total Items</p>
          <p className="text-sm font-medium text-gray-900">
            {integration.stats.totalItems.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Last Sync</p>
          <p className="text-sm font-medium text-gray-900">
            {formatTimestamp(integration.lastSync)}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {integration.errorMessage && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-700">{integration.errorMessage}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={onTest}
            disabled={integration.status === 'syncing'}
            className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <TestTube className="h-3 w-3" />
            <span>Test</span>
          </button>
          
          <button
            onClick={onSync}
            disabled={syncing || integration.status === 'syncing'}
            className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={onEdit}
            className="text-xs text-gray-600 hover:text-gray-700 p-1 rounded"
          >
            <Settings className="h-3 w-3" />
          </button>
          
          <button
            onClick={onDelete}
            className="text-xs text-red-600 hover:text-red-700 p-1 rounded"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </Card>
  </motion.div>
);
} 