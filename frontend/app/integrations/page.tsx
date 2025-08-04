'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Settings, 
  TestTube, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import IntegrationCard from '@/components/integrations/IntegrationCard';
import IntegrationModal from '@/components/integrations/IntegrationModal';
import { toast } from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string | null;
  config: any;
  credentials: {
    subdomain?: string;
    email?: string;
    apiToken?: string;
    accessToken?: string;
    bearerToken?: string;
    searchQuery?: string;
    webhookUrl?: string;
    [key: string]: any;
  };
  stats: {
    totalItems: number;
    lastSyncItems: number;
    avgResponseTime: number | null;
    satisfactionScore: number | null;
  };
  errorMessage?: string;
}

export default function IntegrationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      loadIntegrations();
    }
  }, [user, authLoading, router]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/integrations');
      setIntegrations(response.data.integrations);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null; // Router will handle redirect
  }

  const handleCreateIntegration = () => {
    setSelectedIntegration(null);
    setShowModal(true);
  };

  const handleEditIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowModal(true);
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) {
      return;
    }

    try {
      await api.delete(`/integrations/${integrationId}`);
      setIntegrations(prev => prev.filter(i => i.id !== integrationId));
      toast.success('Integration deleted successfully');
    } catch (error) {
      console.error('Failed to delete integration:', error);
      toast.error('Failed to delete integration');
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    try {
      await api.post(`/integrations/${integrationId}/test`);
      toast.success('Connection test successful');
      loadIntegrations(); // Refresh to get updated status
    } catch (error) {
      console.error('Connection test failed:', error);
      toast.error('Connection test failed');
    }
  };

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      setSyncing(integrationId);
      await api.post(`/integrations/${integrationId}/sync`);
      toast.success('Sync completed successfully');
      loadIntegrations(); // Refresh to get updated data
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedIntegration(null);
  };

  const handleIntegrationSaved = () => {
    loadIntegrations();
    handleModalClose();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
              <p className="text-sm text-gray-500">
                Connect your feedback sources to start analyzing customer sentiment
              </p>
            </div>
            
            <button
              onClick={handleCreateIntegration}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Integration</span>
            </button>
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
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Integrations</p>
                  <p className="text-2xl font-bold text-gray-900">{integrations.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Settings className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connected</p>
                  <p className="text-2xl font-bold text-green-600">
                    {integrations.filter(i => i.status === 'connected').length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Errors</p>
                  <p className="text-2xl font-bold text-red-600">
                    {integrations.filter(i => i.status === 'error').length}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {integrations.reduce((sum, i) => sum + (i.stats?.totalItems || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-full">
                  <RefreshCw className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Integrations Grid */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Your Integrations</h2>
            
            {integrations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 bg-white rounded-lg border border-gray-200"
              >
                <Settings className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
                <p className="text-gray-500 mb-6">
                  Connect your first integration to start collecting and analyzing customer feedback
                </p>
                <button
                  onClick={handleCreateIntegration}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Your First Integration</span>
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration, index) => (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <IntegrationCard
                      integration={integration}
                      onEdit={() => handleEditIntegration(integration)}
                      onDelete={() => handleDeleteIntegration(integration.id)}
                      onTest={() => handleTestConnection(integration.id)}
                      onSync={() => handleSyncIntegration(integration.id)}
                      syncing={syncing === integration.id}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Integration Modal */}
      {showModal && (
        <IntegrationModal
          integration={selectedIntegration}
          onClose={handleModalClose}
          onSaved={handleIntegrationSaved}
        />
      )}
    </div>
  );
} 