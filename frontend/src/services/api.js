import axios from 'axios';

const TOKEN_KEY = 'erp_token';
const USER_KEY = 'erp_user';

const DEFAULT_API_URL = 'http://localhost:5050/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let sessionExpiryEventDispatched = false;

const dispatchSessionExpired = () => {
  if (sessionExpiryEventDispatched) return;

  sessionExpiryEventDispatched = true;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);

  window.dispatchEvent(new Event('auth_session_expired'));

  setTimeout(() => {
    sessionExpiryEventDispatched = false;
  }, 0);
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);

    config.headers = config.headers ?? {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      dispatchSessionExpired();
    }

    if (!error.response) {
      const networkError = new Error(
        'Unable to connect to the server. Please check whether the backend is running.'
      );
      networkError.originalError = error;
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  }
);

export default api;