'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  BarChart3,
  MessageSquare,
  Settings,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Zap,
  TrendingUp,
  Users,
  Shield,
  CreditCard,
  Palette,
  Globe,
  Database,
  Activity,
  AlertTriangle,
  FileText,
  Target,
  Brain,
  Slack,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface NavigationProps {
  currentPage: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and analytics'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Detailed insights and trends'
  },
  {
    name: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
    description: 'Manage customer feedback'
  },
  {
    name: 'Feedback GPT',
    href: '/feedback-gpt',
    icon: Brain,
    description: 'AI-powered feedback analysis'
  },
  {
    name: 'Integrations',
    href: '/integrations',
    icon: Database,
    description: 'Connect your tools'
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: AlertTriangle,
    description: 'Monitor and manage alerts'
  },
  {
    name: 'Segmentation',
    href: '/segmentation',
    icon: Users,
    description: 'Customer segmentation'
  },
  {
    name: 'Churn Prediction',
    href: '/churn-prediction',
    icon: TrendingUp,
    description: 'Predict customer churn'
  },
  {
    name: 'Competitor Analysis',
    href: '/competitor-analysis',
    icon: Target,
    description: 'Analyze competitors'
  },
  {
    name: 'Slack Integration',
    href: '/slack-integration',
    icon: Slack,
    description: 'Slack notifications'
  },
  {
    name: 'Reporting',
    href: '/reporting',
    icon: FileText,
    description: 'Generate reports'
  },
  {
    name: 'API Access',
    href: '/api-access',
    icon: ExternalLink,
    description: 'API documentation'
  },
  {
    name: 'White Label',
    href: '/white-label',
    icon: Palette,
    description: 'Customize branding'
  },
  {
    name: 'Subscription',
    href: '/subscription',
    icon: CreditCard,
    description: 'Manage subscription'
  }
];

const settingsItems = [
  {
    name: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Manage your account'
  },
  {
    name: 'Preferences',
    href: '/settings/preferences',
    icon: Settings,
    description: 'Customize your experience'
  },
  {
    name: 'Security',
    href: '/settings/security',
    icon: Shield,
    description: 'Security settings'
  },
  {
    name: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Notification preferences'
  }
];

export default function Navigation({ currentPage }: NavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'enterprise': return 'from-purple-500 to-purple-600';
      case 'team': return 'from-blue-500 to-blue-600';
      case 'pro': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">InsightPulse</h1>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Collapse button for desktop */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:block p-1 rounded-md hover:bg-gray-100"
            >
              <Menu className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* User info */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <Badge 
                    variant="default" 
                    size="sm"
                    className={`bg-gradient-to-r ${getSubscriptionColor(user?.subscription || 'free')} text-white border-0`}
                  >
                    {user?.subscription || 'free'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Main
              </h3>
              <div className="space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.href.split('/')[1];
                  
                  return (
                    <motion.a
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${
                        isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      <span className="truncate">{item.name}</span>
                    </motion.a>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Settings
              </h3>
              <div className="space-y-1">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  
                  return (
                    <motion.a
                      key={item.name}
                      href={item.href}
                      className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      <span className="truncate">{item.name}</span>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-700 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main content margin for desktop */}
      <div className="hidden lg:block lg:ml-64" />
    </>
  );
} 