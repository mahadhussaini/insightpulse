'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, TestTube, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync: string | null;
  config: {
    searchQuery?: string;
    webhookUrl?: string;
    [key: string]: any;
  };
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

interface IntegrationModalProps {
  integration?: Integration | null;
  onClose: () => void;
  onSaved: () => void;
}

const integrationTypes = [
  { value: 'intercom', label: 'Intercom', icon: '💬', description: 'Customer messaging platform' },
  { value: 'zendesk', label: 'Zendesk', icon: '🎫', description: 'Customer support platform' },
  { value: 'twitter', label: 'Twitter', icon: '🐦', description: 'Social media mentions' },
  { value: 'app_store', label: 'App Store', icon: '🍎', description: 'iOS app reviews' },
  { value: 'google_play', label: 'Google Play', icon: '🤖', description: 'Android app reviews' },
  { value: 'webhook', label: 'Generic Webhook', icon: '🔗', description: 'Custom webhook integration' }
];

export default function IntegrationModal({ integration, onClose, onSaved }: IntegrationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    config: {
      searchQuery: '',
      webhookUrl: ''
    },
    credentials: {
      subdomain: '',
      email: '',
      apiToken: '',
      accessToken: '',
      bearerToken: '',
      searchQuery: '',
      webhookUrl: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEditing = !!integration;

  useEffect(() => {
    if (integration) {
      setFormData({
        name: integration.name,
        type: integration.type,
        config: {
          searchQuery: integration.config?.searchQuery || '',
          webhookUrl: integration.config?.webhookUrl || ''
        },
        credentials: {
          subdomain: integration.credentials?.subdomain || '',
          email: integration.credentials?.email || '',
          apiToken: integration.credentials?.apiToken || '',
          accessToken: integration.credentials?.accessToken || '',
          bearerToken: integration.credentials?.bearerToken || '',
          searchQuery: integration.credentials?.searchQuery || '',
          webhookUrl: integration.credentials?.webhookUrl || ''
        }
      });
    }
  }, [integration]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.type) {
      newErrors.type = 'Integration type is required';
    }

    // Type-specific validation
    if (formData.type === 'zendesk') {
      if (!formData.credentials.subdomain) {
        newErrors.subdomain = 'Subdomain is required';
      }
      if (!formData.credentials.email) {
        newErrors.email = 'Email is required';
      }
      if (!formData.credentials.apiToken) {
        newErrors.apiToken = 'API token is required';
      }
    }

    if (formData.type === 'intercom') {
      if (!formData.credentials.accessToken) {
        newErrors.accessToken = 'Access token is required';
      }
    }

    if (formData.type === 'twitter') {
      if (!formData.credentials.bearerToken) {
        newErrors.bearerToken = 'Bearer token is required';
      }
      if (!formData.config.searchQuery) {
        newErrors.searchQuery = 'Search query is required';
      }
    }

    if (formData.type === 'webhook') {
      if (!formData.config.webhookUrl) {
        newErrors.webhookUrl = 'Webhook URL is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (isEditing) {
        await api.put(`/integrations/${integration.id}`, formData);
        toast.success('Integration updated successfully');
      } else {
        await api.post('/integrations', formData);
        toast.success('Integration created successfully');
      }
      
      onSaved();
    } catch (error: any) {
      console.error('Failed to save integration:', error);
      toast.error(error.response?.data?.error || 'Failed to save integration');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setTesting(true);
      await api.post('/integrations/test', formData);
      toast.success('Connection test successful');
    } catch (error: any) {
      console.error('Connection test failed:', error);
      toast.error(error.response?.data?.error || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const renderTypeSpecificFields = () => {
    switch (formData.type) {
      case 'zendesk':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subdomain
              </label>
              <input
                type="text"
                value={formData.credentials.subdomain || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, subdomain: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="yourcompany"
              />
              {errors.subdomain && (
                <p className="text-red-500 text-xs mt-1">{errors.subdomain}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.credentials.email || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, email: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <div className="relative">
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={formData.credentials.apiToken || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, apiToken: e.target.value }
                  }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your API token"
                />
                <button
                  type="button"
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.apiToken && (
                <p className="text-red-500 text-xs mt-1">{errors.apiToken}</p>
              )}
            </div>
          </div>
        );

      case 'intercom':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <div className="relative">
              <input
                type={showCredentials ? 'text' : 'password'}
                value={formData.credentials.accessToken || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  credentials: { ...prev.credentials, accessToken: e.target.value }
                }))}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your access token"
              />
              <button
                type="button"
                onClick={() => setShowCredentials(!showCredentials)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.accessToken && (
              <p className="text-red-500 text-xs mt-1">{errors.accessToken}</p>
            )}
          </div>
        );

      case 'twitter':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bearer Token
              </label>
              <div className="relative">
                <input
                  type={showCredentials ? 'text' : 'password'}
                  value={formData.credentials.bearerToken || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    credentials: { ...prev.credentials, bearerToken: e.target.value }
                  }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your bearer token"
                />
                <button
                  type="button"
                  onClick={() => setShowCredentials(!showCredentials)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showCredentials ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.bearerToken && (
                <p className="text-red-500 text-xs mt-1">{errors.bearerToken}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Query
              </label>
              <input
                type="text"
                value={formData.config.searchQuery || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  config: { ...prev.config, searchQuery: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="@yourcompany OR #yourproduct"
              />
              {errors.searchQuery && (
                <p className="text-red-500 text-xs mt-1">{errors.searchQuery}</p>
              )}
            </div>
          </div>
        );

      case 'webhook':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.config.webhookUrl || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                config: { ...prev.config, webhookUrl: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://your-webhook-url.com/endpoint"
            />
            {errors.webhookUrl && (
              <p className="text-red-500 text-xs mt-1">{errors.webhookUrl}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Edit Integration' : 'Add Integration'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Integration Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Integration Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {integrationTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      formData.type === type.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{type.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{type.label}</p>
                        <p className="text-xs text-gray-500">{type.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Integration Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Intercom Integration"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Type-specific fields */}
            {formData.type && renderTypeSpecificFields()}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || loading}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TestTube className="h-4 w-4" />
                <span>{testing ? 'Testing...' : 'Test Connection'}</span>
              </button>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 