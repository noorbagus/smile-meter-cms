// types/supabase.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      scheduled_images: {
        Row: {
          id: string
          unit_id: string
          category: string
          image_url: string
          scheduled_date: string
          scheduled_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          category: string
          image_url: string
          scheduled_date: string
          scheduled_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          category?: string
          image_url?: string
          scheduled_date?: string
          scheduled_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_images_scheduled_by_fkey"
            columns: ["scheduled_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_images_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          }
        ]
      }
      unit-images: {
        Row: {
          id: string
          unit_id: string
          category: string
          image_url: string
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          category: string
          image_url: string
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          category?: string
          image_url?: string
          updated_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit-images_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit-images_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      units: {
        Row: {
          id: string
          name: string
          assigned_manager_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          assigned_manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          assigned_manager_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_assigned_manager_id_fkey"
            columns: ["assigned_manager_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      video_uploads: {
        Row: {
          video_id: string
          unit_id: string
          smile_score: number
          reward_category: string
          created_at: string
        }
        Insert: {
          video_id: string
          unit_id: string
          smile_score: number
          reward_category: string
          created_at?: string
        }
        Update: {
          video_id?: string
          unit_id?: string
          smile_score?: number
          reward_category?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_uploads_unit_id_fkey"
            columns: ["unit_id"]
            referencedRelation: "units"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}