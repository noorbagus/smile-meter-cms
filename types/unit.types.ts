// types/unit.types.ts
import { Database } from "./supabase";
import { UserMinimal } from "./user.types";

export type Unit = Database["public"]["Tables"]["units"]["Row"];

export type UnitImage = Database["public"]["Tables"]["unit_images"]["Row"];

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
}

export interface UnitStats {
  totalSessions: number;
  avgSmileScore: number;
  usageToday: number;
  lastActivity?: string;
}