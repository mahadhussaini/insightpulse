'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  MessageSquare,
  BarChart3,
  Zap,
  Bell,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface NavigationProps {
  currentPage?: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: null
  },
  {
    name: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
    badge: null
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    badge: null
  },
  {
    name: 'Integrations',
    href: '/integrations',
    icon: Zap,
    badge: null
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: Bell,
    badge: '3'
  }
];

export default function Navigation({ currentPage = 'dashboard' }: NavigationProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          leftIcon={<Menu className="h-5 w-5" />}
        />
      </div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">InsightPulse</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-6 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.href.replace('/', '');
              
              return (
                <motion.a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                  {item.badge && (
                    <Badge variant="error" size="sm" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </motion.a>
              );
            })}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="h-4 w-4" />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: sidebarOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: sidebarOpen ? 0 : -300 }}
          transition={{ duration: 0.3 }}
          className="relative flex flex-col w-64 max-w-xs bg-white shadow-xl"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900">InsightPulse</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              leftIcon={<X className="h-5 w-5" />}
            />
          </div>

          <div className="flex-1 px-6 py-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.href.replace('/', '');
              
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                  {item.badge && (
                    <Badge variant="error" size="sm" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </a>
              );
            })}
          </div>

          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                leftIcon={<LogOut className="h-4 w-4" />}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
} 