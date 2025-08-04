import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
export const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000') + '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Handle different error types
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
          
        case 403:
          // Forbidden
          toast.error(data.error || 'You do not have permission to perform this action.');
          break;
          
        case 404:
          // Not found
          toast.error(data.error || 'Resource not found.');
          break;
          
        case 422:
          // Validation error
          if (data.details) {
            const errors = data.details.map((err: any) => err.msg).join(', ');
            toast.error(errors);
          } else {
            toast.error(data.error || 'Validation failed.');
          }
          break;
          
        case 429:
          // Rate limit
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          // Other errors
          toast.error(data.error || 'An error occurred. Please try again.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      // Other errors
      toast.error('An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

// API helper functions
export const apiClient = {
  // Auth endpoints
  auth: {
    login: (data: { email: string; password: string }) =>
      api.post('/auth/login', data),
    register: (data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      company?: string;
    }) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    profile: () => api.get('/auth/profile'),
    updateProfile: (data: any) => api.put('/auth/profile', data),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      api.put('/auth/change-password', data),
    forgotPassword: (data: { email: string }) =>
      api.post('/auth/forgot-password', data),
    resetPassword: (data: { token: string; newPassword: string }) =>
      api.post('/auth/reset-password', data),
  },

  // Feedback endpoints
  feedback: {
    getAll: (params?: any) => api.get('/feedback', { params }),
    getById: (id: string) => api.get(`/feedback/${id}`),
    create: (data: any) => api.post('/feedback', data),
    update: (id: string, data: any) => api.put(`/feedback/${id}`, data),
    delete: (id: string) => api.delete(`/feedback/${id}`),
    flag: (id: string, data: { reason: string }) =>
      api.post(`/feedback/${id}/flag`, data),
    unflag: (id: string) => api.post(`/feedback/${id}/unflag`),
    getInsights: (id: string) => api.get(`/feedback/${id}/insights`),
    reprocess: (id: string) => api.post(`/feedback/${id}/reprocess`),
  },

  // Analytics endpoints
  analytics: {
    overview: (params?: any) => api.get('/analytics/overview', { params }),
    sentimentTrends: (params: any) =>
      api.get('/analytics/sentiment-trends', { params }),
    categories: (params?: any) => api.get('/analytics/categories', { params }),
    insights: (params?: any) => api.get('/analytics/insights', { params }),
    sourcePerformance: (params?: any) =>
      api.get('/analytics/source-performance', { params }),
    urgencyAnalysis: (params?: any) =>
      api.get('/analytics/urgency-analysis', { params }),
    weeklySummary: () => api.get('/analytics/weekly-summary'),
  },

  // Dashboard endpoints
  dashboard: {
    getData: (params?: any) => api.get('/dashboard', { params }),
    getWidgets: () => api.get('/dashboard/widgets'),
    updateWidgets: (data: any) => api.put('/dashboard/widgets', data),
    getRealtime: (params?: any) => api.get('/dashboard/realtime', { params }),
    getAlerts: () => api.get('/dashboard/alerts'),
    markAlertRead: (alertId: string) =>
      api.post(`/dashboard/alerts/${alertId}/read`),
    export: (params: any) => api.get('/dashboard/export', { params }),
    getSettings: () => api.get('/dashboard/settings'),
    updateSettings: (data: any) => api.put('/dashboard/settings', data),
  },

  // Integrations endpoints
  integrations: {
    getAll: () => api.get('/integrations'),
    getById: (id: string) => api.get(`/integrations/${id}`),
    create: (data: any) => api.post('/integrations', data),
    update: (id: string, data: any) => api.put(`/integrations/${id}`, data),
    delete: (id: string) => api.delete(`/integrations/${id}`),
    test: (id: string) => api.post(`/integrations/${id}/test`),
    sync: (id: string) => api.post(`/integrations/${id}/sync`),
    getSyncStatus: (id: string) => api.get(`/integrations/${id}/sync-status`),
    getWebhook: (id: string) => api.get(`/integrations/${id}/webhook`),
    updateWebhook: (id: string, data: any) =>
      api.put(`/integrations/${id}/webhook`, data),
    getStats: (id: string) => api.get(`/integrations/${id}/stats`),
  },

  // Webhook endpoints
  webhooks: {
    test: (userId: string, data: any) =>
      api.post(`/webhooks/test/${userId}`, data),
    health: () => api.get('/webhooks/health'),
  },
};

// Export default api instance
export default api; 