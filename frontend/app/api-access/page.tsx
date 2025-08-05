'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Key, 
  Activity, 
  FileText, 
  Settings,
  Eye,
  Copy,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Upload,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Code,
  Terminal,
  BookOpen,
  TestTube
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  rateLimit: string;
  createdAt: string;
  lastUsed: string | null;
  isActive: boolean;
  usage: {
    totalRequests: number;
    requestsToday: number;
    requestsThisMonth: number;
  };
}

interface ApiUsageStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    percentage: number;
  }>;
  rateLimitUsage: {
    current: number;
    limit: number;
    percentage: number;
  };
  errors: {
    rateLimitExceeded: number;
    invalidApiKey: number;
    insufficientPermissions: number;
    serverErrors: number;
  };
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  permissions: string[];
  parameters?: any;
  body?: any;
  response?: any;
  url: string;
  example: string;
}

export default function ApiAccessPage() {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [usageStats, setUsageStats] = useState<ApiUsageStats | null>(null);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('keys');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);

  useEffect(() => {
    loadApiAccessData();
  }, []);

  const loadApiAccessData = async () => {
    setIsLoading(true);
    try {
      const [keysResponse, usageResponse, endpointsResponse] = await Promise.all([
        api.get('/api-access/keys'),
        api.get('/api-access/usage'),
        api.get('/api-access/endpoints')
      ]);

      setApiKeys(keysResponse.data.data);
      setUsageStats(usageResponse.data.data);
      setEndpoints(endpointsResponse.data.data);
    } catch (error) {
      console.error('Error loading API access data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateApiKey = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/api-access/keys', {
        name: newKeyName || 'Default API Key'
      });
      
      if (response.data.success) {
        await loadApiAccessData();
        setShowNewKeyModal(false);
        setNewKeyName('');
        alert('API key generated successfully!');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      alert('Failed to generate API key');
    } finally {
      setIsLoading(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.delete(`/api-access/keys/${keyId}`);
      
      if (response.data.success) {
        await loadApiAccessData();
        alert('API key revoked successfully');
      }
    } catch (error) {
      console.error('Error revoking API key:', error);
      alert('Failed to revoke API key');
    } finally {
      setIsLoading(false);
    }
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    alert('API key copied to clipboard!');
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'read': return 'success';
      case 'write': return 'warning';
      case 'ai': return 'info';
      case 'advanced': return 'error';
      case 'integrations': return 'default';
      case 'billing': return 'default';
      case 'reports': return 'default';
      case 'enterprise': return 'default';
      default: return 'default';
    }
  };

  const getRateLimitColor = (rateLimit: string) => {
    switch (rateLimit) {
      case 'free': return 'default';
      case 'starter': return 'success';
      case 'professional': return 'warning';
      case 'enterprise': return 'error';
      default: return 'default';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'error';
    if (percentage >= 75) return 'warning';
    return 'success';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access API Access Control</h1>
          <Button>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Key className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              API Access Control
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage your API keys, monitor usage, and control access to your InsightPulse data and features.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'keys', name: 'API Keys', icon: Key },
              { id: 'usage', name: 'Usage', icon: Activity },
              { id: 'documentation', name: 'Documentation', icon: FileText },
              { id: 'testing', name: 'Testing', icon: TestTube }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Loading API data...</h3>
          </Card>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'keys' && (
              <div className="space-y-6">
                {/* API Keys Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
                  <Button onClick={() => setShowNewKeyModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New Key
                  </Button>
                </div>

                {/* API Keys List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {apiKeys.map((apiKey) => (
                    <Card key={apiKey.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                          <p className="text-sm text-gray-600">
                            Created {new Date(apiKey.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={apiKey.isActive ? 'success' : 'default'}>
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Rate Limit:</span>
                          <Badge variant={getRateLimitColor(apiKey.rateLimit)}>
                            {apiKey.rateLimit}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Requests:</span>
                          <span className="font-medium">{apiKey.usage.totalRequests.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Today:</span>
                          <span className="font-medium">{apiKey.usage.requestsToday}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-gray-600">Permissions:</div>
                        <div className="flex flex-wrap gap-1">
                          {apiKey.permissions.map((permission) => (
                            <Badge key={permission} variant={getPermissionColor(permission)} size="sm">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedKey(apiKey)}>
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => revokeApiKey(apiKey.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Revoke
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'usage' && usageStats && (
              <div className="space-y-6">
                {/* Usage Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {usageStats.totalRequests.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                  </Card>
                  
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {usageStats.requestsToday}
                    </div>
                    <div className="text-sm text-gray-600">Today</div>
                  </Card>
                  
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {usageStats.averageResponseTime}ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </Card>
                  
                  <Card className="p-6 text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {usageStats.errorRate}%
                    </div>
                    <div className="text-sm text-gray-600">Error Rate</div>
                  </Card>
                </div>

                {/* Rate Limit Usage */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Rate Limit Usage
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Usage</span>
                      <span className="font-medium">
                        {usageStats.rateLimitUsage.current.toLocaleString()} / {usageStats.rateLimitUsage.limit.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          usageStats.rateLimitUsage.percentage >= 90 ? 'bg-red-500' :
                          usageStats.rateLimitUsage.percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usageStats.rateLimitUsage.percentage, 100)}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      {usageStats.rateLimitUsage.percentage.toFixed(1)}% of limit used
                    </div>
                  </div>
                </Card>

                {/* Top Endpoints */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Globe className="w-5 h-5 mr-2" />
                    Top Endpoints
                  </h3>
                  
                  <div className="space-y-3">
                    {usageStats.topEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">{endpoint.endpoint}</div>
                          <div className="text-sm text-gray-600">{endpoint.requests.toLocaleString()} requests</div>
                        </div>
                        <Badge variant="default">
                          {endpoint.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Error Breakdown */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Error Breakdown
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(usageStats.errors).map(([error, count]) => (
                      <div key={error} className="text-center">
                        <div className="text-2xl font-bold text-red-600 mb-1">{count}</div>
                        <div className="text-sm text-gray-600 capitalize">
                          {error.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'documentation' && (
              <div className="space-y-6">
                {/* API Documentation */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2" />
                    API Endpoints
                  </h3>
                  
                  <div className="space-y-4">
                    {endpoints.map((endpoint, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge variant="default">{endpoint.method}</Badge>
                            <span className="font-mono text-sm">{endpoint.path}</span>
                          </div>
                          <div className="flex space-x-1">
                            {endpoint.permissions.map((permission) => (
                              <Badge key={permission} variant={getPermissionColor(permission)} size="sm">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{endpoint.description}</p>
                        
                        <div className="bg-gray-100 p-3 rounded font-mono text-xs">
                          <div className="text-gray-600 mb-1">Example:</div>
                          <pre className="whitespace-pre-wrap">{endpoint.example}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'testing' && (
              <div className="space-y-6">
                {/* API Testing */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TestTube className="w-5 h-5 mr-2" />
                    API Testing
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
                        placeholder="Enter your API key"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg">
                        <option value="">Select an endpoint</option>
                        {endpoints.map((endpoint, index) => (
                          <option key={index} value={endpoint.path}>
                            {endpoint.method} {endpoint.path}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Request Data (JSON)</label>
                      <textarea
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                        placeholder='{"key": "value"}'
                      />
                    </div>
                    
                    <Button className="w-full">
                      <Terminal className="w-4 h-4 mr-2" />
                      Test Request
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* New API Key Modal */}
        {showNewKeyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Generate New API Key</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter a name for this API key"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <Button onClick={generateApiKey} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                    Generate Key
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewKeyModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 