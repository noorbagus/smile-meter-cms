// Path: types/unit.types.ts
import { Database } from "./supabase";
import { UserMinimal } from "./user.types";

export type Unit = Database["public"]["Tables"]["units"]["Row"];

export type UnitImage = Database["public"]["Tables"]["unit-images"]["Row"];

export type RewardCategory = 'small_prize' | 'medium_prize' | 'top_prize';

export interface UnitWithManager extends Unit {
  manager?: UserMinimal;
  status: 'active' | 'inactive';
  lastUpdated?: string;
}

export interface UnitWithImages extends Unit {
  images: {
    [key in RewardCategory]?: UnitImage;
  };
  manager?: UserMinimal;
  status: 'active' | 'inactive';
  lastUpdated?: string;
}

export interface UnitStats {
  totalSessions: number;
  avgSmileScore: number;
  usageToday: number;
  lastActivity?: string;
}

export interface UnitActivity {
  id: string;
  unitId: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  category?: RewardCategory;
}

export interface UnitListItem extends Unit {
  manager_name?: string;
  status: 'active' | 'inactive';
  last_updated?: string;
  usage_today?: number;
}

export interface CreateUnitPayload {
  name: string;
  assigned_manager_id?: string | null;
}

export interface UpdateUnitPayload {
  name?: string;
  assigned_manager_id?: string | null;
}

export interface UploadImagePayload {
  unitId: string;
  category: RewardCategory;
  file: File;
  userId: string;
}

export interface ScheduleImagePayload {
  unitId: string;
  category: RewardCategory;
  imageUrl: string;
  scheduledDate: string;
  scheduledBy: string;
}