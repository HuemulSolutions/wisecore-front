import type { ReactNode } from 'react'
import type { User } from '@/types/users'

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
