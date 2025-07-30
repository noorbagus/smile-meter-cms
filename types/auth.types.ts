// types/auth.types.ts
import { Session, User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'store_manager';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  assigned_units?: string[];
  name?: string;
}

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignInResult {
  error: Error | null;
  success: boolean;
}

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isStoreManager: boolean;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  canAccessUnit: (unitId: string) => boolean;
}