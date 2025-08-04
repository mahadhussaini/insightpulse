'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  Tag,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Navigation from '@/components/layout/Navigation';

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'sentiment_spike' | 'urgent_feedback' | 'integration_error' | 'sync_failed' | 'quota_exceeded' | 'system_maintenance' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  metadata?: any;
  relatedFeedbackIds?: string[];
  relatedIntegrationId?: string;
  expiresAt?: string;
}

export default function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/alerts');
      if (response.data && response.data.alerts) {
        setAlerts(response.data.alerts);
      } else {
        // Set mock data for demonstration
        setAlerts([
          {
            id: '1',
            title: 'Critical: Multiple login failures reported',
            message: 'Users are experiencing login issues across multiple platforms. Immediate attention required.',
            type: 'urgent_feedback',
            severity: 'critical',
            createdAt: '2024-01-07T10:30:00Z',
            updatedAt: '2024-01-07T10:30:00Z',
            isRead: false,
            metadata: { source: 'intercom', category: 'Authentication' }
          },
          {
            id: '2',
            title: 'High: Performance degradation detected',
            message: 'App loading times have increased by 40% in the last 2 hours.',
            type: 'urgent_feedback',
            severity: 'high',
            createdAt: '2024-01-07T09:15:00Z',
            updatedAt: '2024-01-07T09:15:00Z',
            isRead: true,
            metadata: { source: 'zendesk', category: 'Performance' }
          },
          {
            id: '3',
            title: 'Medium: Feature request trending',
            message: 'Dark mode feature request has gained significant traction.',
            type: 'sentiment_spike',
            severity: 'medium',
            createdAt: '2024-01-07T08:45:00Z',
            updatedAt: '2024-01-07T08:45:00Z',
            isRead: true,
            metadata: { source: 'twitter', category: 'Feature Request' }
          },
          {
            id: '4',
            title: 'Info: Weekly summary available',
            message: 'Your weekly feedback summary is ready for review.',
            type: 'system_maintenance',
            severity: 'low',
            createdAt: '2024-01-07T07:00:00Z',
            updatedAt: '2024-01-07T07:00:00Z',
            isRead: true,
            metadata: { source: 'system', category: 'System' }
          },
          {
            id: '5',
            title: 'Low: Minor UI inconsistency',
            message: 'Button alignment issue reported on mobile devices.',
            type: 'urgent_feedback',
            severity: 'low',
            createdAt: '2024-01-06T16:20:00Z',
            updatedAt: '2024-01-06T16:20:00Z',
            isRead: true,
            metadata: { source: 'app_store', category: 'UI/UX' }
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'high': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium': return <Info className="h-5 w-5 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'info': return <Info className="h-5 w-5 text-gray-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'from-red-500 to-red-600';
      case 'high': return 'from-orange-500 to-orange-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-blue-500 to-blue-600';
      case 'info': return 'from-gray-500 to-gray-600';
      default: return 'from-purple-500 to-purple-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || alert.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || (selectedStatus === 'active' && !alert.isRead) || (selectedStatus === 'resolved' && alert.isRead);
    const matchesPriority = selectedPriority === 'all' || alert.severity === selectedPriority;
    
    return matchesSearch && matchesType && matchesStatus && matchesPriority;
  });

  const handleViewAlert = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowModal(true);
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await api.patch(`/alerts/${alertId}`, { status: 'dismissed' });
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'dismissed' } : alert
      ));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await api.patch(`/alerts/${alertId}`, { status: 'resolved' });
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation currentPage="alerts" />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Bell className="h-6 w-6 text-primary-600" />
                  <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
                                     {alerts.filter(a => !a.isRead).length > 0 && (
                     <Badge variant="error" size="sm">
                       {alerts.filter(a => !a.isRead).length}
                     </Badge>
                   )}
                </div>
                <p className="text-sm text-gray-500">
                  Monitor and manage customer feedback alerts
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Settings className="h-4 w-4" />}
                  onClick={() => setShowSettings(true)}
                >
                  Settings
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create Alert
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card padding="md" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search alerts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="all">All Types</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card padding="lg" className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-2">No alerts found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
              </Card>
            ) : (
              filteredAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ 
                    scale: 1.01,
                    transition: { duration: 0.2 }
                  }}
                >
                                     <Card hover padding="lg" className={`relative overflow-hidden ${!alert.isRead ? 'border-l-4 border-l-primary-500' : ''}`}>
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-50" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${getAlertColor(alert.type)} shadow-md`}>
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                                                           <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                             {!alert.isRead && (
                               <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                             )}
                            </div>
                            <p className="text-gray-600 mb-3">{alert.message}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimestamp(alert.createdAt)}</span>
                              </div>
                                                             {alert.metadata?.source && (
                                 <div className="flex items-center space-x-1">
                                   <User className="h-3 w-3" />
                                   <span>{alert.metadata.source}</span>
                                 </div>
                               )}
                            </div>
                          </div>
                        </div>
                        
                                                 <div className="flex items-center space-x-2">
                           <Badge variant="urgency" urgency={alert.severity} size="sm">
                             {alert.severity}
                           </Badge>
                                                       <Badge variant="urgency" urgency={alert.isRead ? 'low' : 'high'} size="sm">
                              {alert.isRead ? 'read' : 'unread'}
                            </Badge>
                         </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewAlert(alert)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        {!alert.isRead && (
                          <button 
                            onClick={() => handleResolveAlert(alert.id)}
                            className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4 w-16 h-16 opacity-10">
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 rounded-full blur-xl" />
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alert Detail Modal */}
      {showModal && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${getAlertColor(selectedAlert.type)}`}>
                    {getAlertIcon(selectedAlert.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Alert Details</h2>
                    <p className="text-sm text-gray-500">{selectedAlert.metadata?.category || 'Alert'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Title</h3>
                  <p className="text-gray-700">{selectedAlert.title}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Message</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedAlert.message}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Type</h3>
                    <Badge variant="urgency" urgency={selectedAlert.severity}>
                      {selectedAlert.type}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Severity</h3>
                    <Badge variant="urgency" urgency={selectedAlert.severity}>
                      {selectedAlert.severity}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                    <Badge variant="urgency" urgency={selectedAlert.isRead ? 'low' : 'high'}>
                      {selectedAlert.isRead ? 'read' : 'unread'}
                    </Badge>
                  </div>
                  {selectedAlert.metadata?.source && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Source</h3>
                      <p className="text-gray-700 capitalize">{selectedAlert.metadata.source}</p>
                    </div>
                  )}
                </div>
                
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                {!selectedAlert.isRead && (
                  <Button variant="success" onClick={() => handleResolveAlert(selectedAlert.id)}>
                    Mark Read
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 