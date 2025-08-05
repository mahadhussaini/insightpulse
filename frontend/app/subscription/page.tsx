'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Shield,
  Crown,
  Star,
  Calendar,
  BarChart3,
  Settings,
  Download,
  ExternalLink,
  Loader2,
  Crown as CrownIcon,
  Star as StarIcon,
  Check as CheckIcon
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    feedbackPerMonth: number;
    aiQueriesPerMonth: number;
    integrations: number;
    users: number;
    retention: string;
  };
  popular?: boolean;
}

interface Subscription {
  plan: string;
  status: string;
  startDate: string;
  endDate: string;
  billingCycle: string;
  nextBillingDate: string;
  usage: {
    feedbackThisMonth: number;
    aiQueriesThisMonth: number;
    integrationsUsed: number;
    usersActive: number;
  };
}

interface UsageAnalytics {
  feedback: {
    used: number;
    limit: number;
    percentage: number;
  };
  aiQueries: {
    used: number;
    limit: number;
    percentage: number;
  };
  integrations: {
    used: number;
    limit: number;
    percentage: number;
  };
  users: {
    used: number;
    limit: number;
    percentage: number;
  };
}

interface BillingHistory {
  id: string;
  date: string;
  amount: number;
  plan: string;
  status: string;
  invoiceUrl: string;
}

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    try {
      const [plansResponse, subscriptionResponse, analyticsResponse, billingResponse] = await Promise.all([
        api.get('/subscription/plans'),
        api.get('/subscription/current'),
        api.get('/subscription/analytics'),
        api.get('/subscription/billing')
      ]);

      setPlans(plansResponse.data.data);
      setSubscription(subscriptionResponse.data.data);
      setUsageAnalytics(analyticsResponse.data.data);
      setBillingHistory(billingResponse.data.data);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/subscription/upgrade', {
        plan: planId,
        billingCycle: 'monthly'
      });
      
      if (response.data.success) {
        await loadSubscriptionData();
        alert('Subscription upgraded successfully!');
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Failed to upgrade subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/subscription/cancel');
      
      if (response.data.success) {
        await loadSubscriptionData();
        alert('Subscription cancelled successfully');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free': return <CheckIcon className="w-5 h-5" />;
      case 'starter': return <StarIcon className="w-5 h-5" />;
      case 'professional': return <CrownIcon className="w-5 h-5" />;
      case 'enterprise': return <Crown className="w-5 h-5" />;
      default: return <CheckIcon className="w-5 h-5" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'free': return 'bg-gray-500';
      case 'starter': return 'bg-blue-500';
      case 'professional': return 'bg-purple-500';
      case 'enterprise': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatLimit = (limit: number) => {
    if (limit === -1) return 'Unlimited';
    return limit.toLocaleString();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access Subscription Management</h1>
          <Button>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <CreditCard className="w-8 h-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Subscription Management
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage your subscription, track usage, and explore plans to unlock more features and insights.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'plans', name: 'Plans', icon: Crown },
              { id: 'usage', name: 'Usage', icon: TrendingUp },
              { id: 'billing', name: 'Billing', icon: CreditCard }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
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
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
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
            {activeTab === 'overview' && subscription && (
              <div className="space-y-6">
                {/* Current Subscription */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Crown className="w-5 h-5 mr-2" />
                    Current Subscription
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                      </div>
                      <div className="text-sm text-gray-600">Plan</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </div>
                      <div className="text-sm text-gray-600">Status</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {subscription.billingCycle.charAt(0).toUpperCase() + subscription.billingCycle.slice(1)}
                      </div>
                      <div className="text-sm text-gray-600">Billing Cycle</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-1">
                        {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600">Next Billing</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    <Button
                      onClick={() => setActiveTab('plans')}
                      className="flex-1"
                    >
                      Upgrade Plan
                    </Button>
                    
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel Subscription
                    </Button>
                  </div>
                </Card>

                {/* Usage Overview */}
                {usageAnalytics && (
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Usage Overview
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(usageAnalytics).map(([key, data]) => (
                        <div key={key} className="text-center">
                          <div className="text-2xl font-bold mb-1">
                            <span className={getUsageColor(data.percentage)}>
                              {data.used.toLocaleString()}
                            </span>
                            <span className="text-gray-400 text-sm ml-1">
                              / {formatLimit(data.limit)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                data.percentage >= 90 ? 'bg-red-500' :
                                data.percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(data.percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="space-y-6">
                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {plans.map((plan) => (
                    <Card 
                      key={plan.id} 
                      className={`p-6 relative ${
                        plan.popular ? 'ring-2 ring-purple-500' : ''
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge variant="success" className="px-3 py-1">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${getPlanColor(plan.id)}`}>
                          {getPlanIcon(plan.id)}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        <div className="text-3xl font-bold text-purple-600 mt-2">
                          ${plan.price}
                          <span className="text-sm text-gray-500 font-normal">/month</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="text-sm text-gray-600">
                          <strong>Feedback:</strong> {formatLimit(plan.limits.feedbackPerMonth)}/month
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>AI Queries:</strong> {formatLimit(plan.limits.aiQueriesPerMonth)}/month
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Integrations:</strong> {formatLimit(plan.limits.integrations)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Users:</strong> {formatLimit(plan.limits.users)}
                        </div>
                        <div className="text-sm text-gray-600">
                          <strong>Retention:</strong> {plan.limits.retention}
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isLoading || subscription?.plan === plan.id}
                        className={`w-full ${
                          subscription?.plan === plan.id ? 'bg-gray-300 cursor-not-allowed' : ''
                        }`}
                      >
                        {subscription?.plan === plan.id ? 'Current Plan' : 'Upgrade'}
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'usage' && usageAnalytics && (
              <div className="space-y-6">
                {/* Detailed Usage */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Detailed Usage
                  </h3>
                  
                  <div className="space-y-6">
                    {Object.entries(usageAnalytics).map(([key, data]) => (
                      <div key={key} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <div className="text-sm text-gray-600">
                            {data.used.toLocaleString()} / {formatLimit(data.limit)}
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              data.percentage >= 90 ? 'bg-red-500' :
                              data.percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(data.percentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-sm font-medium ${
                            data.percentage >= 90 ? 'text-red-600' :
                            data.percentage >= 75 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {data.percentage.toFixed(1)}% used
                          </span>
                          
                          {data.percentage >= 80 && (
                            <Badge variant="warning" className="text-xs">
                              Approaching Limit
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Usage Tips */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Usage Tips
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        <strong>High AI Query Usage:</strong> Consider upgrading to Professional plan for more AI-powered insights.
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        <strong>Feedback Volume:</strong> You're using 23% of your monthly feedback limit.
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Users className="w-4 h-4 text-blue-500 mr-2 mt-0.5" />
                      <div className="text-sm text-gray-600">
                        <strong>Team Growth:</strong> Consider Enterprise plan for unlimited team members.
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-6">
                {/* Billing History */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Billing History
                  </h3>
                  
                  <div className="space-y-4">
                    {billingHistory.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{invoice.plan}</div>
                            <div className="text-gray-600">{new Date(invoice.date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium text-gray-900">${invoice.amount}</div>
                            <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                              {invoice.status}
                            </Badge>
                          </div>
                          
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Invoice
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Payment Method */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Payment Method
                  </h3>
                  
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-6 bg-gray-200 rounded mr-3"></div>
                      <div>
                        <div className="font-medium text-gray-900">•••• •••• •••• 4242</div>
                        <div className="text-sm text-gray-600">Expires 12/25</div>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Update
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