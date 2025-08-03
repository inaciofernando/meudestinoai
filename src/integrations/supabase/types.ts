export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accommodations: {
        Row: {
          check_in_date: string
          check_out_date: string
          created_at: string
          hotel_image_url: string | null
          hotel_link: string | null
          hotel_name: string
          id: string
          notes: string | null
          reservation_amount: number | null
          trip_id: string
          updated_at: string
          user_id: string
          voucher_file_name: string | null
          voucher_file_url: string | null
        }
        Insert: {
          check_in_date: string
          check_out_date: string
          created_at?: string
          hotel_image_url?: string | null
          hotel_link?: string | null
          hotel_name: string
          id?: string
          notes?: string | null
          reservation_amount?: number | null
          trip_id: string
          updated_at?: string
          user_id: string
          voucher_file_name?: string | null
          voucher_file_url?: string | null
        }
        Update: {
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          hotel_image_url?: string | null
          hotel_link?: string | null
          hotel_name?: string
          id?: string
          notes?: string | null
          reservation_amount?: number | null
          trip_id?: string
          updated_at?: string
          user_id?: string
          voucher_file_name?: string | null
          voucher_file_url?: string | null
        }
        Relationships: []
      }
      budget_items: {
        Row: {
          actual_amount: number | null
          category: string | null
          created_at: string
          currency: string
          description: string | null
          expense_date: string | null
          id: string
          is_confirmed: boolean
          location: string | null
          notes: string | null
          payment_method: string | null
          planned_amount: number
          receipt_image_url: string | null
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string | null
          id?: string
          is_confirmed?: boolean
          location?: string | null
          notes?: string | null
          payment_method?: string | null
          planned_amount: number
          receipt_image_url?: string | null
          title: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_amount?: number | null
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          expense_date?: string | null
          id?: string
          is_confirmed?: boolean
          location?: string | null
          notes?: string | null
          payment_method?: string | null
          planned_amount?: number
          receipt_image_url?: string | null
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roteiro_pontos: {
        Row: {
          category: string
          created_at: string
          day_number: number
          description: string | null
          estimated_cost: number | null
          id: string
          images: string[] | null
          location: string
          notes: string | null
          order_index: number
          priority: string
          roteiro_id: string
          time_end: string | null
          time_start: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          day_number: number
          description?: string | null
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          location: string
          notes?: string | null
          order_index?: number
          priority?: string
          roteiro_id: string
          time_end?: string | null
          time_start: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          day_number?: number
          description?: string | null
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          location?: string
          notes?: string | null
          order_index?: number
          priority?: string
          roteiro_id?: string
          time_end?: string | null
          time_start?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roteiros: {
        Row: {
          created_at: string
          description: string | null
          id: string
          title: string
          total_days: number
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          title: string
          total_days?: number
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          total_days?: number
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_documents: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          title: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          budget_currency: string | null
          created_at: string
          description: string | null
          destination: string
          end_date: string | null
          id: string
          images: string[] | null
          start_date: string | null
          status: string | null
          title: string
          total_budget: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_currency?: string | null
          created_at?: string
          description?: string | null
          destination: string
          end_date?: string | null
          id?: string
          images?: string[] | null
          start_date?: string | null
          status?: string | null
          title: string
          total_budget?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_currency?: string | null
          created_at?: string
          description?: string | null
          destination?: string
          end_date?: string | null
          id?: string
          images?: string[] | null
          start_date?: string | null
          status?: string | null
          title?: string
          total_budget?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
