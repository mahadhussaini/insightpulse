'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChartBarIcon, 
  ChatBubbleLeftRightIcon, 
  SparklesIcon,
  ShieldCheckIcon,
  BoltIcon,
  EyeIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon,
  UsersIcon,
  GlobeAltIcon,
  CogIcon,
  PlayIcon,
  ArrowUpRightIcon,
  LightBulbIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

export default function HomePage() {
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Omnichannel Feedback Collection',
      description: 'Integrate with Intercom, Zendesk, Google Play, App Store, Twitter, and more to centralize all customer feedback.',
      color: 'bg-blue-500',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      features: ['Real-time sync', 'Multi-platform support', 'Webhook integration']
    },
    {
      icon: SparklesIcon,
      title: 'AI-Powered Sentiment Analysis',
      description: 'Advanced NLP to classify tone, urgency, and satisfaction with emotion detection and trend spotting.',
      color: 'bg-purple-500',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-pink-50',
      features: ['Emotion detection', 'Trend analysis', 'Smart categorization']
    },
    {
      icon: ChartBarIcon,
      title: 'Smart Analytics Dashboard',
      description: 'Track customer happiness over time, spot emerging issues, and receive weekly AI-generated insights.',
      color: 'bg-green-500',
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-emerald-50',
      features: ['Real-time metrics', 'Custom reports', 'AI insights']
    },
    {
      icon: BoltIcon,
      title: 'Real-time Alerts',
      description: 'Get notified instantly when negative sentiment spikes or new trends emerge that need attention.',
      color: 'bg-orange-500',
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-red-50',
      features: ['Instant notifications', 'Custom thresholds', 'Escalation rules']
    },
    {
      icon: EyeIcon,
      title: 'Auto-tagging & Clustering',
      description: 'Automatically group feedback by issue types, features, or customer segments for better organization.',
      color: 'bg-indigo-500',
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-blue-50',
      features: ['Smart categorization', 'Auto-tagging', 'Segment analysis']
    },
    {
      icon: ShieldCheckIcon,
      title: 'Collaboration Tools',
      description: 'Assign issues, discuss feedback, and track resolutions with your team in one centralized platform.',
      color: 'bg-red-500',
      gradient: 'from-red-500 to-red-600',
      bgGradient: 'from-red-50 to-rose-50',
      features: ['Team collaboration', 'Issue tracking', 'Resolution workflows']
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Product Manager',
      company: 'TechFlow',
      content: 'InsightPulse has transformed how we handle customer feedback. The AI insights are incredibly accurate and actionable.',
      avatar: '/avatars/sarah.jpg',
      rating: 5,
      gradient: 'from-blue-400 to-blue-600',
      stats: { feedback: '2.5K', improvement: '+34%' }
    },
    {
      name: 'Michael Chen',
      role: 'Customer Success Lead',
      company: 'GrowthApp',
      content: 'The real-time alerts have helped us catch and resolve issues before they become bigger problems.',
      avatar: '/avatars/michael.jpg',
      rating: 5,
      gradient: 'from-green-400 to-green-600',
      stats: { feedback: '1.8K', improvement: '+28%' }
    },
    {
      name: 'Emily Rodriguez',
      role: 'Founder',
      company: 'StartupXYZ',
      content: 'Finally, a tool that makes sense of all our scattered feedback. The dashboard is intuitive and powerful.',
      avatar: '/avatars/emily.jpg',
      rating: 5,
      gradient: 'from-purple-400 to-purple-600',
      stats: { feedback: '3.2K', improvement: '+42%' }
    }
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: '/month',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 1,000 feedback items/month',
        '2 integrations',
        'Basic sentiment analysis',
        'Email support'
      ],
      cta: 'Get Started',
      popular: false,
      gradient: 'from-gray-500 to-gray-600',
      bgGradient: 'from-gray-50 to-gray-100'
    },
    {
      name: 'Pro',
      price: '$49',
      period: '/month',
      description: 'For growing teams that need advanced analytics',
      features: [
        'Up to 10,000 feedback items/month',
        'Unlimited integrations',
        'Advanced AI insights',
        'Real-time alerts',
        'Priority support',
        'Custom dashboards'
      ],
      cta: 'Start Free Trial',
      popular: true,
      gradient: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-blue-50'
    },
    {
      name: 'Team',
      price: '$99',
      period: '/month',
      description: 'For teams that need collaboration features',
      features: [
        'Up to 50,000 feedback items/month',
        'Team collaboration tools',
        'Advanced reporting',
        'API access',
        'Dedicated support',
        'Custom integrations'
      ],
      cta: 'Start Free Trial',
      popular: false,
      gradient: 'from-secondary-500 to-secondary-600',
      bgGradient: 'from-secondary-50 to-indigo-50'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Active Users', icon: UsersIcon, gradient: 'from-blue-500 to-blue-600' },
    { number: '50+', label: 'Integrations', icon: CogIcon, gradient: 'from-green-500 to-green-600' },
    { number: '99.9%', label: 'Uptime', icon: GlobeAltIcon, gradient: 'from-purple-500 to-purple-600' },
    { number: '4.9/5', label: 'Rating', icon: StarIcon, gradient: 'from-orange-500 to-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-6000"></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <motion.div 
                  className="flex items-center"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-xl">I</span>
                  </div>
                  <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">
                    InsightPulse
                  </span>
                </motion.div>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Reviews</a>
              <Link href="/login" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">Sign In</Link>
              <Link href="/register">
                <Button variant="primary" size="md">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <Badge variant="success" size="lg" className="mb-6">
                <RocketLaunchIcon className="h-4 w-4 mr-2" />
                AI-Powered Customer Feedback Analytics
              </Badge>
              
              <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                The AI Brain for
                <span className="bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent"> Customer Feedback</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                Automatically aggregate, analyze, and prioritize customer feedback from all sources. 
                Reduce churn, improve product development, and increase customer satisfaction.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <div className="relative">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-80 text-lg py-4 px-6"
                />
                <Button variant="primary" size="lg" className="absolute right-2 top-2">
                  Start Free Trial
                </Button>
              </div>
            </motion.div>

            {/* Enhanced Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="info" size="lg" className="mb-4 shadow-lg">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to understand your customers
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From sentiment analysis to trend detection, InsightPulse gives you the tools 
              to turn feedback into actionable business insights.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Card hover padding="lg" className={`bg-gradient-to-br ${feature.bgGradient} border-0 shadow-lg group-hover:shadow-2xl transition-all duration-300`}>
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all duration-200`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="success" size="lg" className="mb-4 shadow-lg">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by teams worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See how InsightPulse is helping teams understand their customers better.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Card hover padding="lg" className="shadow-lg group-hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 bg-gradient-to-br ${testimonial.gradient} rounded-full mr-3 flex items-center justify-center shadow-lg`}>
                      <span className="text-white font-semibold text-sm">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role} at {testimonial.company}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="warning" size="lg" className="mb-4 shadow-lg">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that's right for your team and scale as you grow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Card 
                  hover 
                  padding="lg" 
                  className={`relative bg-gradient-to-br ${plan.bgGradient} border-0 shadow-lg group-hover:shadow-2xl transition-all duration-300 ${plan.popular ? 'ring-2 ring-primary-500 shadow-xl' : ''}`}
                >
                  {plan.popular && (
                    <motion.div 
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Badge variant="success" size="sm" className="shadow-lg">
                        Most Popular
                      </Badge>
                    </motion.div>
                  )}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-500">{plan.period}</span>
                    </div>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.popular ? 'primary' : 'outline'} 
                    fullWidth 
                    size="lg"
                    className="shadow-lg hover:shadow-xl"
                  >
                    {plan.cta}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-blue-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to transform your customer feedback?
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of teams using InsightPulse to understand their customers better 
              and build products people love.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/register">
                  <Button 
                    variant="secondary" 
                    size="lg"
                    className="shadow-lg hover:shadow-xl"
                  >
                    Start Free Trial
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/demo">
                  <Button 
                    variant="ghost" 
                    size="lg"
                    className="text-white hover:bg-white/10 shadow-lg hover:shadow-xl"
                  >
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Watch Demo
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <motion.div className="flex items-center mb-4" whileHover={{ scale: 1.05 }}>
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="ml-3 text-xl font-bold">InsightPulse</span>
              </motion.div>
              <p className="text-gray-400">
                AI-powered customer feedback analytics platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors duration-200">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-white transition-colors duration-200">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition-colors duration-200">Integrations</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors duration-200">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors duration-200">About</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors duration-200">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors duration-200">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors duration-200">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors duration-200">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors duration-200">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors duration-200">Status</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors duration-200">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 InsightPulse. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 