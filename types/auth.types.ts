// types/auth.types.ts
import { Session, User } from '@supabase/supabase-js';

// User roles
export type UserRole = 'admin' | 'store_manager';

// User profile with additional info beyond Supabase auth
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  assigned_units?: string[];
  created_at?: string;
  updated_at?: string;
}

// Authentication context shape
export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStoreManager: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
  canAccessUnit: (unitId: string) => boolean;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Auth state
export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

// Auth API response
export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    user?: User;
    profile?: UserProfile;
    session?: Session;
  };
}

// Protected route props
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  unitId?: string;
  redirectTo?: string;
}