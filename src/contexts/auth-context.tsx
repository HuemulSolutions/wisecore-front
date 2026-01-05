import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { httpClient } from '@/lib/http-client';
import type { User } from '@/services/users';

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        httpClient.setLoginToken(savedToken);
        console.log('AuthContext: Restored login token from localStorage:', savedToken.substring(0, 10) + '...');
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    // Set up unauthorized handler
    httpClient.setOnUnauthorized(() => {
      logout();
    });
    
    setIsLoading(false);
  }, []);

  const login = (authToken: string, userData: User) => {
    console.log('AuthContext: Login called with token:', authToken.substring(0, 10) + '...', 'and user:', userData.email);
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    httpClient.setLoginToken(authToken);
    console.log('AuthContext: Login completed, login token set in httpClient');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('selectedOrganizationId'); // Limpiar organización seleccionada
    localStorage.removeItem('organizationToken'); // Limpiar token de organización
    httpClient.setLoginToken(null);
    httpClient.setOrganizationToken(null);
    httpClient.setOrganizationId(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('auth_user', JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};