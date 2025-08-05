'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  AlertTriangle, 
  TrendingDown, 
  BarChart3, 
  Calendar, 
  Clock,
  Settings,
  TestTube,
  History,
  CheckCircle,
  XCircle,
  Loader2,
  Zap,
  Bell,
  ToggleLeft,
  ToggleRight,
  ExternalLink
} from 'lucide-react';

interface NotificationType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface NotificationSettings {
  enabled: boolean;
  channel: string;
  frequency: string;
  day?: string;
  time?: string;
}

interface SlackConfiguration {
  webhookUrl: string;
  channelId: string;
  botToken: string | null;
  enabled: boolean;
}

interface NotificationStats {
  totalSent: number;
  successRate: number;
  byType: {
    [key: string]: number;
  };
  byTimeRange: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
  errors: {
    total: number;
    rate: number;
    types: {
      [key: string]: number;
    };
  };
}

export default function SlackIntegrationPage() {
  const { user } = useAuth();
  const [configuration, setConfiguration] = useState<SlackConfiguration | null>(null);
  const [notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('configuration');

  // Form states
  const [webhookUrl, setWebhookUrl] = useState('');
  const [channelId, setChannelId] = useState('');
  const [botToken, setBotToken] = useState('');
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    loadSlackData();
  }, []);

  const loadSlackData = async () => {
    setIsLoading(true);
    try {
      const [configResponse, typesResponse, settingsResponse, statsResponse] = await Promise.all([
        api.get('/slack-integration/configuration'),
        api.get('/slack-integration/types'),
        api.get('/slack-integration/settings'),
        api.get('/slack-integration/stats')
      ]);

      setConfiguration(configResponse.data.data);
      setNotificationTypes(typesResponse.data.data);
      setSettings(settingsResponse.data.data);
      setStats(statsResponse.data.data.stats);

      // Set form values from configuration
      if (configResponse.data.data) {
        setWebhookUrl(configResponse.data.data.webhookUrl || '');
        setChannelId(configResponse.data.data.channelId || '');
        setEnabled(configResponse.data.data.enabled || false);
      }
    } catch (error) {
      console.error('Error loading Slack data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/slack-integration/test', {
        webhookUrl,
        channelId
      });
      setTestResult(response.data.data);
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResult({ connected: false, error: 'Connection test failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigure = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('/slack-integration/configure', {
        webhookUrl,
        channelId,
        botToken,
        enabled
      });
      
      if (response.data.success) {
        await loadSlackData();
      }
    } catch (error) {
      console.error('Error configuring Slack:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestNotification = async (type: string) => {
    setIsLoading(true);
    try {
      const testData = {
        feedback: {
          id: 'test-1',
          content: 'This is a test notification from InsightPulse',
          customerName: 'Test User',
          sentiment: 'positive',
          urgency: 'medium',
          source: 'test',
          createdAt: new Date()
        },
        user: { id: user?.id, name: user?.firstName }
      };

      const response = await api.post('/slack-integration/send-test', {
        type,
        data: testData
      });
      
      if (response.data.success) {
        alert('Test notification sent successfully!');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotification = async (type: string, enabled: boolean) => {
    try {
      const response = await api.post('/slack-integration/toggle', {
        type,
        enabled
      });
      
      if (response.data.success) {
        await loadSlackData();
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
    }
  };

  const getNotificationIcon = (icon: string) => {
    switch (icon) {
      case 'message-square': return <MessageSquare className="w-4 h-4" />;
      case 'alert-triangle': return <AlertTriangle className="w-4 h-4" />;
      case 'trending-down': return <TrendingDown className="w-4 h-4" />;
      case 'bar-chart-3': return <BarChart3 className="w-4 h-4" />;
      case 'calendar': return <Calendar className="w-4 h-4" />;
      case 'clock': return <Clock className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      case 'yellow': return 'bg-yellow-500';
      case 'green': return 'bg-green-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access Slack Integration</h1>
          <Button>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Slack Integration
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect InsightPulse to Slack for real-time notifications and automated alerts. Get instant updates about feedback, churn risks, and sentiment changes.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'configuration', name: 'Configuration', icon: Settings },
              { id: 'notifications', name: 'Notifications', icon: Bell },
              { id: 'test', name: 'Test & History', icon: TestTube },
              { id: 'stats', name: 'Statistics', icon: BarChart3 }
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
            <h3 className="text-lg font-semibold text-gray-900">Loading...</h3>
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
            {activeTab === 'configuration' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Configuration Form */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Slack Configuration
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook URL
                      </label>
                      <Input
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Channel ID
                      </label>
                      <Input
                        type="text"
                        value={channelId}
                        onChange={(e) => setChannelId(e.target.value)}
                        placeholder="#feedback"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bot Token (Optional)
                      </label>
                      <Input
                        type="password"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        placeholder="xoxb-..."
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => setEnabled(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Enable Slack Integration
                        </span>
                      </label>
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button
                        onClick={handleConfigure}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Configuring...
                          </>
                        ) : (
                          'Save Configuration'
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleTestConnection}
                        disabled={isLoading || !webhookUrl}
                        variant="outline"
                      >
                        Test Connection
                      </Button>
                    </div>
                  </div>
                  
                  {/* Test Result */}
                  {testResult && (
                    <div className={`mt-4 p-3 rounded-lg ${
                      testResult.connected 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center">
                        {testResult.connected ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600 mr-2" />
                        )}
                        <span className="text-sm font-medium">
                          {testResult.connected ? 'Connection successful!' : 'Connection failed'}
                        </span>
                      </div>
                      {testResult.error && (
                        <p className="text-sm text-gray-600 mt-1">{testResult.error}</p>
                      )}
                    </div>
                  )}
                </Card>

                {/* Current Status */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Connection Status
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status</span>
                      <Badge variant={configuration?.enabled ? 'success' : 'error'}>
                        {configuration?.enabled ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Webhook URL</span>
                      <span className="text-sm font-medium">
                        {configuration?.webhookUrl ? 'Configured' : 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Channel</span>
                      <span className="text-sm font-medium">
                        {configuration?.channelId || 'Not set'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Bot Token</span>
                      <span className="text-sm font-medium">
                        {configuration?.botToken ? 'Configured' : 'Not set'}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                {/* Notification Types */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Notification Types
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notificationTypes.map((type) => (
                      <div key={type.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getNotificationColor(type.color)}`}>
                              {getNotificationIcon(type.icon)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{type.name}</h4>
                              <p className="text-sm text-gray-600">{type.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleNotification(type.id, !settings?.notifications?.[type.id]?.enabled)}
                            className="flex items-center"
                          >
                            {settings?.notifications?.[type.id]?.enabled ? (
                              <ToggleRight className="w-5 h-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Channel: {settings?.notifications?.[type.id]?.channel || '#general'}</span>
                          <span>Frequency: {settings?.notifications?.[type.id]?.frequency || 'immediate'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Settings */}
                {settings && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Settings className="w-5 h-5 mr-2" />
                      General Settings
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Default Channel
                        </label>
                        <Input
                          type="text"
                          value={settings.general?.defaultChannel || '#insightpulse'}
                          className="w-full"
                          readOnly
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Timezone
                        </label>
                        <Input
                          type="text"
                          value={settings.general?.timezone || 'UTC'}
                          className="w-full"
                          readOnly
                        />
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'test' && (
              <div className="space-y-6">
                {/* Test Notifications */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <TestTube className="w-5 h-5 mr-2" />
                    Test Notifications
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notificationTypes.map((type) => (
                      <div key={type.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getNotificationColor(type.color)}`}>
                              {getNotificationIcon(type.icon)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{type.name}</h4>
                              <p className="text-sm text-gray-600">{type.description}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => handleSendTestNotification(type.id)}
                          disabled={isLoading}
                          variant="outline"
                          className="w-full"
                        >
                          Send Test
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* History */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Recent Notifications
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Mock history data */}
                    {[
                      {
                        id: '1',
                        type: 'new_feedback',
                        sentAt: new Date(Date.now() - 1000 * 60 * 30),
                        status: 'delivered',
                        messageId: '1234567890.123456'
                      },
                      {
                        id: '2',
                        type: 'high_priority',
                        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
                        status: 'delivered',
                        messageId: '1234567890.123457'
                      }
                    ].map((notification) => (
                      <div key={notification.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Badge variant="success" className="mr-3">
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {notification.sentAt.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={notification.status === 'delivered' ? 'success' : 'error'}>
                            {notification.status}
                          </Badge>
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Overview Stats */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Overview
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Sent</span>
                      <span className="font-semibold text-blue-600">{stats.totalSent}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="font-semibold text-green-600">{stats.successRate}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Error Rate</span>
                      <span className="font-semibold text-red-600">{stats.errors.rate}%</span>
                    </div>
                  </div>
                </Card>

                {/* By Type */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    By Notification Type
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <span className="font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Time Range */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    By Time Range
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last 7 Days</span>
                      <span className="font-semibold">{stats.byTimeRange.last7Days}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last 30 Days</span>
                      <span className="font-semibold">{stats.byTimeRange.last30Days}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Last 90 Days</span>
                      <span className="font-semibold">{stats.byTimeRange.last90Days}</span>
                    </div>
                  </div>
                </Card>

                {/* Errors */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <XCircle className="w-5 h-5 mr-2" />
                    Error Analysis
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Errors</span>
                      <span className="font-semibold text-red-600">{stats.errors.total}</span>
                    </div>
                    
                    {Object.entries(stats.errors.types).map(([type, count]) => (
                      <div key={type} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">
                          {type.replace('_', ' ')}
                        </span>
                        <span className="font-semibold text-red-600">{count}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
} 