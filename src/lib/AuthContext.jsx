import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

// Resolve the current token from storage/URL at call-time (not just at module load)
const getCurrentToken = () => {
  const stored = localStorage.getItem('base44_access_token');
  if (stored) return stored;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('access_token') || appParams.token || null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const checkInProgress = useRef(false);

  useEffect(() => {
    checkAppState();
  }, []);

  // Force validate the token against the API — always makes a live /me call
  const validateToken = async () => {
    const token = getCurrentToken();
    if (!token) return false;
    try {
      const currentUser = await base44.auth.me();
      if (currentUser) {
        setUser(currentUser);
        setIsAuthenticated(true);
        setAuthError(null);
        return true;
      }
    } catch {
      // Token is invalid/expired — clear it
      localStorage.removeItem('base44_access_token');
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    }
    return false;
  };

  const checkAppState = async () => {
    if (checkInProgress.current) return;
    checkInProgress.current = true;

    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);

      const token = getCurrentToken();

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: { 'X-App-Id': appParams.appId },
        token: token || undefined,
        interceptResponses: true
      });

      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        setIsLoadingPublicSettings(false);

        // Always force-validate the token via a live /me call regardless of cached state
        const valid = await validateToken();
        if (!valid) {
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        }
      } catch (appError) {
        console.error('App state check failed:', appError);
        setIsLoadingPublicSettings(false);

        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          setAuthError({ type: reason, message: appError.message });
          // For auth_required: still attempt token validation — token may be valid but public endpoint blocked
          if (reason === 'auth_required') {
            await validateToken();
          }
        } else if (appError.status === 401) {
          localStorage.removeItem('base44_access_token');
          localStorage.removeItem('token');
          setAuthError({ type: 'auth_required', message: 'Session expired. Please log in again.' });
        } else {
          setAuthError({ type: 'unknown', message: appError.message || 'Failed to load app' });
        }
      }
    } catch (error) {
      console.error('Unexpected error in checkAppState:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
      checkInProgress.current = false;
    }
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    const valid = await validateToken();
    if (!valid) {
      setAuthError({ type: 'auth_required', message: 'Authentication required' });
    }
    setIsLoadingAuth(false);
    setAuthChecked(true);
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(false);
    localStorage.removeItem('base44_access_token');
    localStorage.removeItem('token');
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};