import axios, { AxiosError } from 'axios';

// Resolve backend API URL
const rawApiUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();

let apiBase = '/api/v1';
if (rawApiUrl) {
  const cleanUrl = rawApiUrl.replace(/\/+$/, '');
  apiBase = cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
}

// Development vs Production warning
if (import.meta.env.PROD && (apiBase.includes('localhost') || apiBase.includes('127.0.0.1'))) {
  console.warn(
    '[RailOne Warning] VITE_API_URL is configured to localhost in production. ' +
    'Cloud-hosted frontend cannot reach localhost on client devices. ' +
    'Please set VITE_API_URL to your deployed backend (e.g. Render or Railway).'
  );
}

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('railone_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Detect if SPA HTML fallback was returned instead of JSON API response
    const contentType = String(response.headers['content-type'] || '');
    if (typeof response.data === 'string' && contentType.includes('text/html') && response.config.url) {
      const err = new Error(
        'RailOne API endpoint returned HTML instead of JSON. Please verify backend service and VITE_API_URL.'
      );
      return Promise.reject(err);
    }
    return response;
  },
  (error: AxiosError<any>) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired
      localStorage.removeItem('railone_token');
      localStorage.removeItem('railone_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }

    // Transform generic "Network Error" into user-friendly message
    if (!error.response || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const friendlyMsg =
        'Unable to connect to RailOne server. Please check your internet connection or verify that the backend API is online.';
      const enhancedError = new Error(friendlyMsg);
      (enhancedError as any).isNetworkError = true;
      (enhancedError as any).originalError = error;
      return Promise.reject(enhancedError);
    }

    // Extract structured error message from FastAPI if present
    const serverMsg =
      error.response?.data?.error?.message ||
      error.response?.data?.detail ||
      error.response?.data?.message;

    if (serverMsg && typeof serverMsg === 'string') {
      const enhancedError = new Error(serverMsg);
      (enhancedError as any).response = error.response;
      (enhancedError as any).status = error.response.status;
      return Promise.reject(enhancedError);
    }

    return Promise.reject(error);
  }
);

export default api;
