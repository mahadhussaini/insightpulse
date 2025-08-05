'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Download, 
  Clock, 
  BarChart3,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Calendar,
  Settings,
  Eye,
  Plus,
  Filter,
  Zap,
  Lightbulb,
  Shield,
  Crown,
  Star
} from 'lucide-react';

interface ReportType {
  id: string;
  name: string;
  description: string;
  timeRanges: string[];
  exportFormats: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  timeRange: string;
  metrics: string[];
  category: string;
}

interface ReportHistory {
  id: string;
  reportType: string;
  name: string;
  generatedAt: string;
  timeRange: string;
  status: string;
  downloadUrl: string;
}

interface ScheduledReport {
  id: string;
  reportType: string;
  name: string;
  schedule: string;
  recipients: string[];
  format: string;
  status: string;
  nextRun: string;
  lastRun: string;
}

export default function ReportingPage() {
  const { user } = useAuth();
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [exportFormat, setExportFormat] = useState('pdf');

  useEffect(() => {
    loadReportingData();
  }, []);

  const loadReportingData = async () => {
    setIsLoading(true);
    try {
      const [typesResponse, templatesResponse, historyResponse, scheduledResponse] = await Promise.all([
        api.get('/reporting/types'),
        api.get('/reporting/templates'),
        api.get('/reporting/history'),
        api.get('/reporting/scheduled')
      ]);

      setReportTypes(typesResponse.data.data);
      setTemplates(templatesResponse.data.data);
      setHistory(historyResponse.data.data.reports);
      setScheduledReports(scheduledResponse.data.data);
    } catch (error) {
      console.error('Error loading reporting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/reporting/${reportType}`, {
        params: { timeRange }
      });
      
      if (response.data.success) {
        // Handle report generation success
        await loadReportingData();
        alert('Report generated successfully!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const exportReport = async (reportData: any, format: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/reporting/export', {
        reportData,
        format
      });
      
      if (response.data.success) {
        // Handle export success
        alert('Report exported successfully!');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report');
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleReport = async (reportType: string, schedule: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/reporting/schedule', {
        reportType,
        timeRange,
        schedule,
        recipients: ['admin@company.com'],
        format: exportFormat
      });
      
      if (response.data.success) {
        await loadReportingData();
        alert('Report scheduled successfully!');
      }
    } catch (error) {
      console.error('Error scheduling report:', error);
      alert('Failed to schedule report');
    } finally {
      setIsLoading(false);
    }
  };

  const getReportIcon = (reportType: string) => {
    switch (reportType) {
      case 'executive_summary': return <Crown className="w-5 h-5" />;
      case 'customer_satisfaction': return <Users className="w-5 h-5" />;
      case 'feedback_trends': return <TrendingUp className="w-5 h-5" />;
      case 'competitive_analysis': return <Target className="w-5 h-5" />;
      case 'churn_analysis': return <AlertTriangle className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getReportColor = (reportType: string) => {
    switch (reportType) {
      case 'executive_summary': return 'bg-purple-500';
      case 'customer_satisfaction': return 'bg-blue-500';
      case 'feedback_trends': return 'bg-green-500';
      case 'competitive_analysis': return 'bg-orange-500';
      case 'churn_analysis': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getScheduleIcon = (schedule: string) => {
    switch (schedule) {
      case 'daily': return <Clock className="w-4 h-4" />;
      case 'weekly': return <Calendar className="w-4 h-4" />;
      case 'monthly': return <Calendar className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access Advanced Reporting</h1>
          <Button>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Advanced Reporting
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Generate comprehensive reports, schedule automated exports, and gain deep insights into your customer feedback data.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                Report Configuration
              </h2>
              <div className="flex space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="180d">Last 180 days</option>
                    <option value="1y">Last year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'templates', name: 'Templates', icon: FileText },
              { id: 'history', name: 'History', icon: Clock },
              { id: 'scheduled', name: 'Scheduled', icon: Calendar },
              { id: 'custom', name: 'Custom', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
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
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Generating report...</h3>
            <p className="text-gray-600">Please wait while we process your data</p>
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
            {activeTab === 'templates' && (
              <div className="space-y-6">
                {/* Report Templates */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <Card key={template.id} className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${getReportColor(template.id)}`}>
                            {getReportIcon(template.id)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-600">{template.category}</p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="text-xs text-gray-500">
                          <strong>Metrics:</strong> {template.metrics.join(', ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          <strong>Time Range:</strong> {template.timeRange}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => generateReport(template.id)}
                          disabled={isLoading}
                          className="flex-1"
                        >
                          Generate
                        </Button>
                        
                        <Button
                          onClick={() => scheduleReport(template.id, 'weekly')}
                          disabled={isLoading}
                          variant="outline"
                          size="sm"
                        >
                          Schedule
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* Report History */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Recent Reports
                  </h3>
                  
                  <div className="space-y-4">
                    {history.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getReportColor(report.reportType)}`}>
                            {getReportIcon(report.reportType)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{report.name}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(report.generatedAt).toLocaleDateString()} • {report.timeRange}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge variant={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'scheduled' && (
              <div className="space-y-6">
                {/* Scheduled Reports */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Scheduled Reports
                  </h3>
                  
                  <div className="space-y-4">
                    {scheduledReports.map((report) => (
                      <div key={report.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getReportColor(report.reportType)}`}>
                              {getReportIcon(report.reportType)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{report.name}</div>
                              <div className="text-sm text-gray-600">
                                {getScheduleIcon(report.schedule)} {report.schedule} • {report.format.toUpperCase()}
                              </div>
                            </div>
                          </div>
                          
                          <Badge variant={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Next Run:</span>
                            <div className="font-medium">{new Date(report.nextRun).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Recipients:</span>
                            <div className="font-medium">{report.recipients.length} email(s)</div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 mt-3">
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="space-y-6">
                {/* Custom Report Builder */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Custom Report Builder
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                      <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select report type</option>
                        {reportTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Metrics</label>
                      <div className="space-y-2">
                        {['totalFeedback', 'satisfactionRate', 'responseRate', 'averageSentiment', 'churnRisk'].map((metric) => (
                          <label key={metric} className="flex items-center">
                            <input type="checkbox" className="mr-2" />
                            <span className="text-sm">{metric.replace(/([A-Z])/g, ' $1').trim()}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Custom Report
                    </Button>
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