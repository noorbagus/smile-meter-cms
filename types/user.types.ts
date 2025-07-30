// types/user.types.ts
import { Database } from "../types/supabase";
import { Unit } from "./unit.types";

export type User = Database["public"]["Tables"]["users"]["Row"];

export type UserRole = 'admin' | 'store_manager';

export interface UserWithUnits extends User {
  assignedUnits?: Unit[];
}

export interface UserMinimal {
  id: string;
  email: string;
  role: UserRole;
}