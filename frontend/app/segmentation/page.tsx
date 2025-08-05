'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  BarChart3, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Filter,
  PieChart,
  Target,
  Activity,
  MapPin,
  Clock,
  CreditCard,
  Eye,
  Lightbulb
} from 'lucide-react';

interface SegmentType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Segment {
  id: string;
  name: string;
  description: string;
  feedback: any[];
  stats: {
    count: number;
    percentage: number;
    avgSentiment: number;
    topCategories: Array<{ category: string; count: number }>;
    topSources: Array<{ source: string; count: number }>;
    urgencyDistribution: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
}

interface SegmentationData {
  segmentType: string;
  segments: Segment[];
  metadata: {
    totalFeedback: number;
    timeRange: string;
    source: string;
    segmentCount: number;
  };
}

interface SegmentInsight {
  type: string;
  title: string;
  description: string;
  value: string;
  percentage?: number;
  sentiment?: number;
  count?: number;
}

export default function SegmentationPage() {
  const { user } = useAuth();
  const [segmentTypes, setSegmentTypes] = useState<SegmentType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [segmentationData, setSegmentationData] = useState<SegmentationData | null>(null);
  const [insights, setInsights] = useState<SegmentInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [source, setSource] = useState('all');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadSegmentTypes();
  }, []);

  useEffect(() => {
    if (selectedType) {
      loadSegmentation();
      loadInsights();
    }
  }, [selectedType, timeRange, source]);

  const loadSegmentTypes = async () => {
    try {
      const response = await api.get('/segmentation/types');
      setSegmentTypes(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedType(response.data.data[0].id);
      }
    } catch (error) {
      console.error('Error loading segment types:', error);
    }
  };

  const loadSegmentation = async () => {
    if (!selectedType) return;

    setIsLoading(true);
    try {
      const response = await api.get(`/segmentation/${selectedType}`, {
        params: {
          timeRange,
          source,
          limit: 1000,
          includeMetadata: true
        }
      });
      setSegmentationData(response.data.data);
    } catch (error) {
      console.error('Error loading segmentation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInsights = async () => {
    if (!selectedType) return;

    try {
      const response = await api.get(`/segmentation/${selectedType}/insights`, {
        params: {
          timeRange,
          source
        }
      });
      setInsights(response.data.data.insights);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  };

  const handleSegmentSelect = (segmentId: string) => {
    setSelectedSegments(prev => 
      prev.includes(segmentId) 
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const getSegmentTypeIcon = (type: string) => {
    switch (type) {
      case 'persona': return <Users className="w-5 h-5" />;
      case 'lifecycle': return <BarChart3 className="w-5 h-5" />;
      case 'plan': return <CreditCard className="w-5 h-5" />;
      case 'behavior': return <Activity className="w-5 h-5" />;
      case 'geographic': return <MapPin className="w-5 h-5" />;
      case 'temporal': return <Clock className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'success';
    if (sentiment < -0.3) return 'error';
    return 'warning';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <CheckCircle className="w-4 h-4" />;
    if (sentiment < -0.3) return <XCircle className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access Segmentation</h1>
          <Button>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-green-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              User Segmentation
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover patterns in your user base with advanced segmentation. Group users by personas, lifecycle stages, behavior patterns, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Segment Type Selector */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Segment Type
              </h2>
              <div className="space-y-3">
                {segmentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedType === type.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      {getSegmentTypeIcon(type.id)}
                      <span className="font-medium text-gray-900 ml-2">{type.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </button>
                ))}
              </div>
            </Card>

            {/* Filters */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All sources</option>
                    <option value="intercom">Intercom</option>
                    <option value="zendesk">Zendesk</option>
                    <option value="app_store">App Store</option>
                    <option value="google_play">Google Play</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Comparison Tools */}
            {segmentationData && segmentationData.segments.length > 1 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Compare Segments
                </h3>
                <div className="space-y-2">
                  {segmentationData.segments.map((segment) => (
                    <label key={segment.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSegments.includes(segment.id)}
                        onChange={() => handleSegmentSelect(segment.id)}
                        className="mr-2"
                      />
                      <span className="text-sm">{segment.name}</span>
                    </label>
                  ))}
                </div>
                {selectedSegments.length >= 2 && (
                  <Button
                    onClick={() => setShowComparison(true)}
                    className="w-full mt-4"
                  >
                    Compare Selected
                  </Button>
                )}
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Loading State */}
            {isLoading && (
              <Card className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Analyzing segments...</h3>
                <p className="text-gray-600">Processing your feedback data</p>
              </Card>
            )}

            {/* Insights */}
            {insights.length > 0 && !isLoading && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Key Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900 mb-1">{insight.title}</div>
                      <div className="text-sm text-gray-600">{insight.description}</div>
                      {insight.percentage && (
                        <Badge variant="success" className="mt-2">
                          {insight.percentage.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Segments Grid */}
            {segmentationData && !isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {segmentationData.segments.map((segment) => (
                  <motion.div
                    key={segment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{segment.name}</h3>
                        <Badge variant={getSentimentColor(segment.stats.avgSentiment)}>
                          {getSentimentIcon(segment.stats.avgSentiment)}
                          {segment.stats.avgSentiment > 0 ? '+' : ''}{segment.stats.avgSentiment.toFixed(2)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{segment.description}</p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Feedback Count</span>
                          <span className="font-semibold">{segment.stats.count}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Percentage</span>
                          <span className="font-semibold">{segment.stats.percentage.toFixed(1)}%</span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${segment.stats.percentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Top Categories */}
                      {segment.stats.topCategories.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Top Categories</h4>
                          <div className="flex flex-wrap gap-1">
                            {segment.stats.topCategories.slice(0, 3).map((cat, index) => (
                              <Badge key={index} variant="default" className="text-xs">
                                {cat.category} ({cat.count})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Urgency Distribution */}
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Urgency Distribution</h4>
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-semibold text-blue-600">{segment.stats.urgencyDistribution.low}</div>
                            <div className="text-gray-500">Low</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-yellow-600">{segment.stats.urgencyDistribution.medium}</div>
                            <div className="text-gray-500">Medium</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-orange-600">{segment.stats.urgencyDistribution.high}</div>
                            <div className="text-gray-500">High</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-red-600">{segment.stats.urgencyDistribution.critical}</div>
                            <div className="text-gray-500">Critical</div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!segmentationData && !isLoading && (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Segments Found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Select a segment type and adjust your filters to see user segments based on your feedback data.
                </p>
              </Card>
            )}

            {/* Metadata */}
            {segmentationData && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{segmentationData.metadata.totalFeedback}</div>
                    <div className="text-sm text-gray-500">Total Feedback</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{segmentationData.metadata.segmentCount}</div>
                    <div className="text-sm text-gray-500">Segments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{timeRange}</div>
                    <div className="text-sm text-gray-500">Time Range</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{source}</div>
                    <div className="text-sm text-gray-500">Source</div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 