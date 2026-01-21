/**
 * Authentication helper functions
 */

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

// Token management
export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return sessionStorage.getItem('access_token');
    } catch (error) {
      console.error('Error reading access token from sessionStorage:', error);
      return null;
    }
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      return sessionStorage.getItem('refresh_token');
    } catch (error) {
      console.error('Error reading refresh token from sessionStorage:', error);
      return null;
    }
  }
  return null;
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window !== 'undefined') {
    try {
      if (accessToken) {
        sessionStorage.setItem('access_token', accessToken);
      }
      if (refreshToken) {
        sessionStorage.setItem('refresh_token', refreshToken);
      }
    } catch (error) {
      console.error('Error storing tokens in sessionStorage:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }
};

export const clearTokens = (): void => {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Error clearing tokens from sessionStorage:', error);
    }
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  return !!token;
};

// Get role-based landing page
export const getRoleLandingPage = (role: UserRole): string => {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'MANAGER':
      return '/manager/dashboard';
    case 'EMPLOYEE':
      return '/dashboard';
    default:
      return '/dashboard';
  }
};

// Role constants
export const ROLES = {
  EMPLOYEE: 'EMPLOYEE' as const,
  MANAGER: 'MANAGER' as const,
  ADMIN: 'ADMIN' as const
};

// Check if user has required role
export const hasRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
};

// Role hierarchy check (e.g., ADMIN can access MANAGER and EMPLOYEE routes)
export const canAccessRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const hierarchy: Record<UserRole, number> = {
    ADMIN: 3,
    MANAGER: 2,
    EMPLOYEE: 1
  };
  return hierarchy[userRole] >= hierarchy[requiredRole];
};

