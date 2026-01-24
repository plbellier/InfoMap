import { useState, useEffect, useCallback } from 'react';

interface User {
  email: string;
  name: string;
  picture: string;
}

interface AuthState {
  authenticated: boolean;
  user: User | null;
  is_admin: boolean;
  loading: boolean;
}

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>({
    authenticated: false,
    user: null,
    is_admin: false,
    loading: true
  });

  const checkAuth = useCallback(async () => {
    try {
        const defaultApi = window.location.hostname === 'localhost' ? 'http://localhost:8000' : (window.location.hostname === 'infomap.ovh' ? '/api' : `http://${window.location.hostname}:8000`);
        const apiBase = import.meta.env.VITE_API_URL || defaultApi;      const response = await fetch(`${apiBase}/me`, { credentials: 'include' });
      const data = await response.json();
      
      setAuth({
        authenticated: data.authenticated,
        user: data.user || null,
        is_admin: data.is_admin || false,
        loading: false
      });
    } catch (error) {
      console.error("Auth check failed:", error);
      setAuth(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { ...auth, refresh: checkAuth };
};
