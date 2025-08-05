'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Palette, 
  Image, 
  Type, 
  Code,
  Mail,
  FileText,
  Settings,
  Eye,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Globe,
  Zap,
  Shield,
  Crown,
  Star,
  Palette as PaletteIcon,
  Image as ImageIcon,
  Type as TypeIcon,
  Code as CodeIcon,
  Mail as MailIcon,
  FileText as FileTextIcon
} from 'lucide-react';

interface WhiteLabelConfig {
  enabled: boolean;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  branding: {
    logo: string | null;
    favicon: string | null;
    companyName: string;
    tagline: string;
    domain: string | null;
    customCSS: string | null;
    customJS: string | null;
  };
  features: {
    customBranding: boolean;
    customDomain: boolean;
    customTheme: boolean;
    customCSS: boolean;
    customJS: boolean;
    customEmailTemplates: boolean;
    customReports: boolean;
    customIntegrations: boolean;
    customAPI: boolean;
  };
  customizations: {
    logo: string;
    favicon: string;
    companyName: string;
    tagline: string;
    domain: string;
    customCSS: string | null;
    customJS: string | null;
  };
  emailTemplates: {
    welcome: string;
    weeklySummary: string;
    alert: string;
  };
  reports: {
    customTemplates: any[];
    customMetrics: any[];
    customCharts: any[];
  };
}

interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
  preview: string;
}

interface EmailTemplateType {
  id: string;
  name: string;
  description: string;
  variables: string[];
}

export default function WhiteLabelPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [emailTemplateTypes, setEmailTemplateTypes] = useState<EmailTemplateType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [customCSS, setCustomCSS] = useState('');
  const [customJS, setCustomJS] = useState('');

  useEffect(() => {
    loadWhiteLabelData();
  }, []);

  const loadWhiteLabelData = async () => {
    setIsLoading(true);
    try {
      const [configResponse, themesResponse, templateTypesResponse] = await Promise.all([
        api.get('/white-label/config'),
        api.get('/white-label/themes'),
        api.get('/white-label/email-template-types')
      ]);

      setConfig(configResponse.data.data);
      setThemes(themesResponse.data.data);
      setEmailTemplateTypes(templateTypesResponse.data.data);
      
      if (configResponse.data.data.customizations.customCSS) {
        setCustomCSS(configResponse.data.data.customizations.customCSS);
      }
      if (configResponse.data.data.customizations.customJS) {
        setCustomJS(configResponse.data.data.customizations.customJS);
      }
    } catch (error) {
      console.error('Error loading white label data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTheme = async (theme: any) => {
    setIsLoading(true);
    try {
      const response = await api.put('/white-label/theme', { theme });
      
      if (response.data.success) {
        await loadWhiteLabelData();
        alert('Theme updated successfully!');
      }
    } catch (error) {
      console.error('Error updating theme:', error);
      alert('Failed to update theme');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBranding = async (branding: any) => {
    setIsLoading(true);
    try {
      const response = await api.put('/white-label/branding', { branding });
      
      if (response.data.success) {
        await loadWhiteLabelData();
        alert('Branding updated successfully!');
      }
    } catch (error) {
      console.error('Error updating branding:', error);
      alert('Failed to update branding');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomCSS = async () => {
    setIsLoading(true);
    try {
      const response = await api.put('/white-label/css', { css: customCSS });
      
      if (response.data.success) {
        alert('Custom CSS updated successfully!');
      }
    } catch (error) {
      console.error('Error updating custom CSS:', error);
      alert('Failed to update custom CSS');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCustomJS = async () => {
    setIsLoading(true);
    try {
      const response = await api.put('/white-label/js', { js: customJS });
      
      if (response.data.success) {
        alert('Custom JavaScript updated successfully!');
      }
    } catch (error) {
      console.error('Error updating custom JavaScript:', error);
      alert('Failed to update custom JavaScript');
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    switch (feature) {
      case 'customBranding': return <ImageIcon className="w-4 h-4" />;
      case 'customDomain': return <Globe className="w-4 h-4" />;
      case 'customTheme': return <PaletteIcon className="w-4 h-4" />;
      case 'customCSS': return <CodeIcon className="w-4 h-4" />;
      case 'customJS': return <CodeIcon className="w-4 h-4" />;
      case 'customEmailTemplates': return <MailIcon className="w-4 h-4" />;
      case 'customReports': return <FileTextIcon className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getFeatureColor = (feature: string) => {
    switch (feature) {
      case 'customBranding': return 'bg-blue-500';
      case 'customDomain': return 'bg-green-500';
      case 'customTheme': return 'bg-purple-500';
      case 'customCSS': return 'bg-orange-500';
      case 'customJS': return 'bg-red-500';
      case 'customEmailTemplates': return 'bg-indigo-500';
      case 'customReports': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to access White Label Features</h1>
          <Button>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              White Label Features
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Customize your branding, themes, and appearance to match your company's identity and create a seamless customer experience.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'branding', name: 'Branding', icon: Image },
              { id: 'theming', name: 'Theming', icon: Palette },
              { id: 'customization', name: 'Custom Code', icon: Code },
              { id: 'email', name: 'Email Templates', icon: Mail },
              { id: 'features', name: 'Features', icon: Settings }
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
            <h3 className="text-lg font-semibold text-gray-900">Updating configuration...</h3>
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
            {activeTab === 'branding' && config && (
              <div className="space-y-6">
                {/* Branding Configuration */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Image className="w-5 h-5 mr-2" />
                    Branding Configuration
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                      <input
                        type="text"
                        defaultValue={config.customizations.companyName}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter company name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tagline</label>
                      <input
                        type="text"
                        defaultValue={config.customizations.tagline}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Enter tagline"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                      <input
                        type="url"
                        defaultValue={config.customizations.logo}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
                      <input
                        type="url"
                        defaultValue={config.customizations.favicon}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="https://example.com/favicon.ico"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom Domain</label>
                      <input
                        type="text"
                        defaultValue={config.customizations.domain}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="feedback.yourcompany.com"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button onClick={() => updateBranding(config.customizations)}>
                      Update Branding
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'theming' && (
              <div className="space-y-6">
                {/* Theme Selection */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Theme Selection
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {themes.map((theme) => (
                      <div
                        key={theme.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedTheme === theme.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => setSelectedTheme(theme.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900">{theme.name}</h4>
                          {selectedTheme === theme.id && (
                            <CheckCircle className="w-5 h-5 text-purple-600" />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.colors.primary }}></div>
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.colors.secondary }}></div>
                          <div className="w-6 h-6 rounded" style={{ backgroundColor: theme.colors.accent }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedTheme && (
                    <div className="mt-6">
                      <Button onClick={() => updateTheme(themes.find(t => t.id === selectedTheme)?.colors)}>
                        Apply Theme
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Custom Theme Builder */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Custom Theme Builder
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(config?.theme || {}).map(([color, value]) => (
                      <div key={color}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {color.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            defaultValue={value}
                            className="w-12 h-10 border border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            defaultValue={value}
                            className="flex-1 p-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6">
                    <Button onClick={() => updateTheme(config?.theme)}>
                      Update Custom Theme
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'customization' && (
              <div className="space-y-6">
                {/* Custom CSS */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    Custom CSS
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">CSS Code</label>
                    <textarea
                      value={customCSS}
                      onChange={(e) => setCustomCSS(e.target.value)}
                      className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500"
                      placeholder="/* Add your custom CSS here */"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button onClick={updateCustomCSS}>
                      Update CSS
                    </Button>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </Card>

                {/* Custom JavaScript */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Code className="w-5 h-5 mr-2" />
                    Custom JavaScript
                  </h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">JavaScript Code</label>
                    <textarea
                      value={customJS}
                      onChange={(e) => setCustomJS(e.target.value)}
                      className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500"
                      placeholder="// Add your custom JavaScript here"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button onClick={updateCustomJS}>
                      Update JavaScript
                    </Button>
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                {/* Email Templates */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Email Templates
                  </h3>
                  
                  <div className="space-y-4">
                    {emailTemplateTypes.map((templateType) => (
                      <div key={templateType.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{templateType.name}</h4>
                          <Badge variant="default">{templateType.variables.length} variables</Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{templateType.description}</p>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                          <Button variant="outline" size="sm">
                            <Code className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'features' && config && (
              <div className="space-y-6">
                {/* White Label Features */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Available Features
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(config.features).map(([feature, enabled]) => (
                      <div key={feature} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${getFeatureColor(feature)}`}>
                              {getFeatureIcon(feature)}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 capitalize">
                                {feature.replace(/([A-Z])/g, ' $1').trim()}
                              </h4>
                            </div>
                          </div>
                          
                          <Badge variant={enabled ? 'success' : 'default'}>
                            {enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          Customize {feature.replace(/([A-Z])/g, ' $1').toLowerCase()} for your brand
                        </p>
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