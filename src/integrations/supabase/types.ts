export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      creator_monthly_revenue: {
        Row: {
          created_at: string
          creator_id: string
          events_revenue: number
          id: string
          month: string
          rooms_bookings: number
          rooms_gna: number
          rooms_revenue: number
          tours_bookings: number
          tours_revenue: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          events_revenue?: number
          id?: string
          month: string
          rooms_bookings?: number
          rooms_gna?: number
          rooms_revenue?: number
          tours_bookings?: number
          tours_revenue?: number
          updated_at?: string
          year?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          events_revenue?: number
          id?: string
          month?: string
          rooms_bookings?: number
          rooms_gna?: number
          rooms_revenue?: number
          tours_bookings?: number
          tours_revenue?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "creator_monthly_revenue_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_revenue: {
        Row: {
          creator_code: string
          events_revenue: number | null
          hgl_bookings: number | null
          hgl_revenue: number | null
          id: string
          month: string
          rd_bookings: number | null
          rd_gna: number | null
          rd_room_revenue: number | null
          synced_at: string | null
        }
        Insert: {
          creator_code: string
          events_revenue?: number | null
          hgl_bookings?: number | null
          hgl_revenue?: number | null
          id?: string
          month: string
          rd_bookings?: number | null
          rd_gna?: number | null
          rd_room_revenue?: number | null
          synced_at?: string | null
        }
        Update: {
          creator_code?: string
          events_revenue?: number | null
          hgl_bookings?: number | null
          hgl_revenue?: number | null
          id?: string
          month?: string
          rd_bookings?: number | null
          rd_gna?: number | null
          rd_room_revenue?: number | null
          synced_at?: string | null
        }
        Relationships: []
      }
      creators: {
        Row: {
          code: string
          created_at: string
          creator_id: string | null
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          code: string
          created_at?: string
          creator_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          creator_id?: string | null
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      revenue_history: {
        Row: {
          changed_at: string
          creator_code: string | null
          creator_id: string | null
          id: string
          month: string | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          source_table: string
          year: number | null
        }
        Insert: {
          changed_at?: string
          creator_code?: string | null
          creator_id?: string | null
          id?: string
          month?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          source_table: string
          year?: number | null
        }
        Update: {
          changed_at?: string
          creator_code?: string | null
          creator_id?: string | null
          id?: string
          month?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          source_table?: string
          year?: number | null
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
