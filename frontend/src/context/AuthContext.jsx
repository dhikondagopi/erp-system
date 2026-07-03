import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
} from 'react';
import api from '../services/api';
import { can as checkPermission } from '../config/permissions';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'erp_token';
const USER_KEY = 'erp_user';

const safeParseJSON = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Failed to parse stored auth user:', error);
    return null;
  }
};

const normalizeUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== 'object') {
    return null;
  }

  const firstName = rawUser.first_name ?? rawUser.firstName ?? '';
  const lastName = rawUser.last_name ?? rawUser.lastName ?? '';

  return {
    ...rawUser,
    first_name: firstName,
    last_name: lastName,
    firstName,
    lastName,
    full_name: [firstName, lastName].filter(Boolean).join(' ').trim(),
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cachedUser = safeParseJSON(localStorage.getItem(USER_KEY));
    return normalizeUser(cachedUser);
  });

  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const persistAuthState = useCallback((nextUser, nextToken) => {
    const normalizedUser = normalizeUser(nextUser);

    setUser(normalizedUser);
    setToken(nextToken || null);

    if (nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    if (normalizedUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
    } else {
      localStorage.removeItem(USER_KEY);
    }

    return normalizedUser;
  }, []);

  useEffect(() => {
    const cachedToken = localStorage.getItem(TOKEN_KEY);
    const cachedUser = normalizeUser(safeParseJSON(localStorage.getItem(USER_KEY)));

    if (cachedToken && cachedUser) {
      setToken(cachedToken);
      setUser(cachedUser);
    } else if (cachedToken || cachedUser) {
      clearAuthState();
    }

    setIsLoading(false);
  }, [clearAuthState]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthState();
    };

    const handleStorageChange = (event) => {
      if (event.key === TOKEN_KEY || event.key === USER_KEY) {
        const nextToken = localStorage.getItem(TOKEN_KEY);
        const nextUser = normalizeUser(safeParseJSON(localStorage.getItem(USER_KEY)));

        setToken(nextToken);
        setUser(nextUser);
      }
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [clearAuthState]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, token: userToken } = response?.data?.data || {};

      if (!userData || !userToken) {
        throw new Error('Invalid login response from server.');
      }

      return persistAuthState(userData, userToken);
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Login failed. Please check credentials.'
      );
    }
  }, [persistAuthState]);

  const register = useCallback(async (email, password, firstName, lastName, role) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      });

      const { user: userData, token: userToken } = response?.data?.data || {};

      if (!userData || !userToken) {
        throw new Error('Invalid registration response from server.');
      }

      return persistAuthState(userData, userToken);
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.message || 'Registration failed.'
      );
    }
  }, [persistAuthState]);

  const logout = useCallback(() => {
    clearAuthState();
  }, [clearAuthState]);

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  const hasRole = useCallback((allowedRoles = []) => {
    if (!user || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return false;
    }

    return allowedRoles.includes(user.role);
  }, [user]);

  const can = useCallback((module, action) => {
    return checkPermission(user?.role, module, action);
  }, [user]);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    hasRole,
    can,
  }), [user, token, isAuthenticated, isLoading, login, register, logout, hasRole, can]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Named hook export so files can do: import { useAuth } from '../context/AuthContext'
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;