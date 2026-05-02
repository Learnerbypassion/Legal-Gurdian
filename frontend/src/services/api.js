import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect to login for these endpoints (they should work without auth)
    const allowedUnauthenticatedEndpoints = [
      '/upload',
      '/ai/analyze',
      '/professionals/recommend',
      '/chat'
    ];
    
    const isAllowedEndpoint = allowedUnauthenticatedEndpoints.some(
      endpoint => error.config?.url?.includes(endpoint)
    );

    if (error.response?.status === 401 && !isAllowedEndpoint) {
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Upload PDF and extract text
 * @param {File} file
 * @param {Object} options
 * @param {(progress: number) => void} onProgress
 */
export const uploadPDF = async (file, options = {}, onProgress) => {
  const formData = new FormData();
  formData.append('contract', file);
  formData.append('userType', options.userType || 'general');
  formData.append('language', options.language || 'English');

  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return data;
};

/**
 * Analyze contract text
 * @param {{ contractText, filename, userType, language, charCount }} payload
 */
export const analyzeContract = async (payload) => {
  const { data } = await api.post('/ai/analyze', payload);
  return data;
};

/**
 * Ask a follow-up question
 * @param {{ contractText, question, history, language }} payload
 */
export const askQuestion = async (payload) => {
  const { data } = await api.post('/chat', payload);
  return data;
};

/**
 * Get authenticated user's document history
 */
export const getUserDocuments = async () => {
  const { data } = await api.get('/upload/documents');
  return data;
};

/**
 * Update user profile (for professionals)
 */
export const updateProfile = async (payload) => {
  const { data } = await api.put('/auth/profile', payload);
  return data;
};

/**
 * Recommend professionals based on type
 */
export const getRecommendedProfessionals = async (type) => {
  const { data } = await api.get(`/professionals/recommend?type=${type}`);
  return data;
};

/**
 * Contact a professional
 */
export const contactProfessional = async (professionalId) => {
  const { data } = await api.post('/professionals/contact', { professionalId });
  return data;
};
