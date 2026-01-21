'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, UserProfile } from '@/lib/apiClient';
import { setTokens, clearTokens, getRoleLandingPage, UserRole } from '@/lib/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  logout: () => void;
  refreshUser: (suppressErrors?: boolean) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile
  const refreshUser = async (suppressErrors = false): Promise<UserProfile | null> => {
    try {
      const response = await authApi.getProfile();
      const userData = response.data;
      
      // Ensure we only store the necessary user fields
      const userProfile: UserProfile = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        ratePerOrder: userData.ratePerOrder || null,
        isActive: userData.isActive,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
      
      setUser(userProfile);
      return userProfile;
    } catch (error: any) {
      // Only log error if not suppressed (e.g., during bootstrap with expired token)
      if (!suppressErrors) {
        console.error('Failed to fetch user profile:', error);
      }
      // Only clear user if the error is auth-related (401)
      if (error.response?.status === 401) {
        setUser(null);
        clearTokens();
      }
      return null;
    }
  };

  // Bootstrap: Check if user is authenticated on mount
  useEffect(() => {
    const bootstrap = async () => {
      if (typeof window !== 'undefined') {
        const token = sessionStorage.getItem('access_token');
        if (token) {
          // Suppress errors during bootstrap - expired tokens are expected
          await refreshUser(true);
        }
      }
      setLoading(false);
    };
    bootstrap();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    try {
      const response = await authApi.login(email, password);
      const { user: userData, access_token, refresh_token } = response.data;

      // Validate response structure
      if (!access_token || !refresh_token || !userData) {
        throw new Error('Invalid response from server');
      }

      // Store tokens
      setTokens(access_token, refresh_token);

      // Ensure user data has all required fields
      const userProfile: UserProfile = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Set user state
      setUser(userProfile);

      // Route based on role
      const landingPage = getRoleLandingPage(userData.role);
      router.push(landingPage);

      return { success: true, user: userProfile };
    } catch (error: any) {
      console.error('Login failed:', error);
      
      // Clear any partial auth state
      clearTokens();
      setUser(null);
      
      // Extract error message
      const message = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = (): void => {
    // Clear user state
    setUser(null);
    
    // Clear tokens from storage
    clearTokens();
    
    // Redirect to login
    router.push('/login');
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

