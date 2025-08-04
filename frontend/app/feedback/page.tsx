'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Filter,
  Search,
  Calendar,
  User,
  Tag,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Navigation from '@/components/layout/Navigation';

interface Feedback {
  id: string;
  content: string;
  source: string;
  customerName: string;
  customerEmail?: string;
  title?: string;
  rating?: number;
  createdAt: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  categories?: any;
  tags?: string[];
  responseTime?: number;
  status?: 'new' | 'in_progress' | 'resolved' | 'closed';
}

export default function FeedbackPage() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedSentiment, setSelectedSentiment] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, []);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get('/feedback');
      // Handle the API response structure correctly
      if (response.data && response.data.feedback) {
        setFeedback(response.data.feedback);
      } else {
        setFeedback([]);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredFeedback = (Array.isArray(feedback) ? feedback : []).filter(item => {
    const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = selectedSource === 'all' || item.source === selectedSource;
    const matchesSentiment = selectedSentiment === 'all' || item.sentiment === selectedSentiment;
    const matchesUrgency = selectedUrgency === 'all' || item.urgency === selectedUrgency;
    
    return matchesSearch && matchesSource && matchesSentiment && matchesUrgency;
  });

  const sortedFeedback = [...filteredFeedback].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'timestamp':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'author':
        aValue = (a.customerName || '').toLowerCase();
        bValue = (b.customerName || '').toLowerCase();
        break;
      case 'sentiment':
        aValue = a.sentiment;
        bValue = b.sentiment;
        break;
      case 'urgency':
        aValue = a.urgency;
        bValue = b.urgency;
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleViewFeedback = (item: Feedback) => {
    setSelectedFeedback(item);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation currentPage="feedback" />
      
      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
                <p className="text-sm text-gray-500">
                  Manage and analyze all customer feedback
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Export
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Feedback
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card padding="md" className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Source Filter */}
              <div>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="all">All Sources</option>
                  <option value="intercom">Intercom</option>
                  <option value="zendesk">Zendesk</option>
                  <option value="twitter">Twitter</option>
                  <option value="app_store">App Store</option>
                  <option value="google_play">Google Play</option>
                </select>
              </div>

              {/* Sentiment Filter */}
              <div>
                <select
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="all">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>

              {/* Urgency Filter */}
              <div>
                <select
                  value={selectedUrgency}
                  onChange={(e) => setSelectedUrgency(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="all">All Urgency</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Feedback List */}
          <div className="space-y-4">
            {sortedFeedback.length === 0 ? (
              <Card padding="lg" className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium mb-2">No feedback found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
              </Card>
            ) : (
              sortedFeedback.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ 
                    scale: 1.01,
                    transition: { duration: 0.2 }
                  }}
                >
                  <Card hover padding="lg" className="relative overflow-hidden">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-30" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${getSourceColor(item.source)} shadow-md`}>
                            <span className="text-white text-sm">{getSourceIcon(item.source)}</span>
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-700 capitalize">
                              {item.source.replace('_', ' ')}
                            </span>
                                                         <div className="flex items-center space-x-2 text-xs text-gray-500">
                               <Calendar className="h-3 w-3" />
                               <span>{formatTimestamp(item.createdAt)}</span>
                             </div>
                          </div>
                        </div>
                        
                        {/* Sentiment and urgency indicators */}
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
                            <span className="text-sm font-medium text-gray-700">{item.customerName || 'Anonymous'}</span>
                          </div>
                          
                          {/* Sentiment Badge */}
                          <Badge variant="sentiment" sentiment={item.sentiment === 'mixed' ? 'neutral' : item.sentiment} size="sm">
                            {item.sentiment}
                          </Badge>

                          {/* Urgency Badge */}
                          <Badge variant="urgency" urgency={item.urgency} size="sm">
                            {item.urgency}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewFeedback(item)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center group-hover:scale-105 transition-transform"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          <button className="text-gray-600 hover:text-gray-700 text-sm">
                            <Edit className="h-3 w-3" />
                          </button>
                          <button className="text-red-600 hover:text-red-700 text-sm">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
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
                    
                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4 w-16 h-16 opacity-10">
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-xl" />
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Pagination */}
          {sortedFeedback.length > 0 && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {sortedFeedback.length} of {feedback.length} feedback items
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      {showModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Feedback Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Content</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedFeedback.content}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Author</h3>
                                         <p className="text-gray-700">{selectedFeedback.customerName || 'Anonymous'}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Source</h3>
                    <p className="text-gray-700 capitalize">{selectedFeedback.source.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Sentiment</h3>
                                         <Badge variant="sentiment" sentiment={selectedFeedback.sentiment === 'mixed' ? 'neutral' : selectedFeedback.sentiment}>
                       {selectedFeedback.sentiment}
                     </Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Urgency</h3>
                    <Badge variant="urgency" urgency={selectedFeedback.urgency}>
                      {selectedFeedback.urgency}
                    </Badge>
                  </div>
                </div>
                
                {selectedFeedback.tags && selectedFeedback.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeedback.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                <Button variant="primary">
                  Respond
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 