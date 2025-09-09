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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accommodations: {
        Row: {
          accommodation_type: string | null
          address: string | null
          check_in_date: string
          check_out_date: string
          city: string | null
          confirmation_number: string | null
          country: string | null
          created_at: string
          email: string | null
          hotel_image_url: string | null
          hotel_link: string | null
          hotel_name: string
          id: string
          includes_breakfast: boolean | null
          notes: string | null
          parking_available: boolean | null
          pet_friendly: boolean | null
          phone: string | null
          reservation_amount: number | null
          room_type: string | null
          trip_id: string
          updated_at: string
          user_id: string
          voucher_file_name: string | null
          voucher_file_url: string | null
          waze_link: string | null
          wifi_available: boolean | null
        }
        Insert: {
          accommodation_type?: string | null
          address?: string | null
          check_in_date: string
          check_out_date: string
          city?: string | null
          confirmation_number?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          hotel_image_url?: string | null
          hotel_link?: string | null
          hotel_name: string
          id?: string
          includes_breakfast?: boolean | null
          notes?: string | null
          parking_available?: boolean | null
          pet_friendly?: boolean | null
          phone?: string | null
          reservation_amount?: number | null
          room_type?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
          voucher_file_name?: string | null
          voucher_file_url?: string | null
          waze_link?: string | null
          wifi_available?: boolean | null
        }
        Update: {
          accommodation_type?: string | null
          address?: string | null
          check_in_date?: string
          check_out_date?: string
          city?: string | null
          confirmation_number?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          hotel_image_url?: string | null
          hotel_link?: string | null
          hotel_name?: string
          id?: string
          includes_breakfast?: boolean | null
          notes?: string | null
          parking_available?: boolean | null
          pet_friendly?: boolean | null
          phone?: string | null
          reservation_amount?: number | null
          room_type?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
          voucher_file_name?: string | null
          voucher_file_url?: string | null
          waze_link?: string | null
          wifi_available?: boolean | null
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
          establishment: string | null
          expense_date: string | null
          expense_type: string
          id: string
          is_confirmed: boolean
          notes: string | null
          payment_method: string | null
          payment_method_type: string | null
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
          establishment?: string | null
          expense_date?: string | null
          expense_type?: string
          id?: string
          is_confirmed?: boolean
          notes?: string | null
          payment_method?: string | null
          payment_method_type?: string | null
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
          establishment?: string | null
          expense_date?: string | null
          expense_type?: string
          id?: string
          is_confirmed?: boolean
          notes?: string | null
          payment_method?: string | null
          payment_method_type?: string | null
          planned_amount?: number
          receipt_image_url?: string | null
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      concierge_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "concierge_conversations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string
          theme_mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone: string
          theme_mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string
          theme_mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          created_at: string
          cuisine_type: string | null
          estimated_amount: number | null
          google_maps_link: string | null
          id: string
          notes: string | null
          phone: string | null
          reservation_date: string | null
          reservation_time: string | null
          restaurant_image_url: string | null
          restaurant_link: string | null
          restaurant_name: string
          trip_id: string
          tripadvisor_link: string | null
          updated_at: string
          user_id: string
          voucher_file_name: string | null
          voucher_file_url: string | null
          waze_link: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          cuisine_type?: string | null
          estimated_amount?: number | null
          google_maps_link?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          reservation_date?: string | null
          reservation_time?: string | null
          restaurant_image_url?: string | null
          restaurant_link?: string | null
          restaurant_name: string
          trip_id: string
          tripadvisor_link?: string | null
          updated_at?: string
          user_id: string
          voucher_file_name?: string | null
          voucher_file_url?: string | null
          waze_link?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          cuisine_type?: string | null
          estimated_amount?: number | null
          google_maps_link?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          reservation_date?: string | null
          reservation_time?: string | null
          restaurant_image_url?: string | null
          restaurant_link?: string | null
          restaurant_name?: string
          trip_id?: string
          tripadvisor_link?: string | null
          updated_at?: string
          user_id?: string
          voucher_file_name?: string | null
          voucher_file_url?: string | null
          waze_link?: string | null
        }
        Relationships: []
      }
      roteiro_pontos: {
        Row: {
          address: string | null
          category: string
          created_at: string
          day_number: number
          description: string | null
          estimated_cost: number | null
          google_maps_link: string | null
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
          tripadvisor_link: string | null
          updated_at: string
          user_id: string
          voucher_files: Json | null
          waze_link: string | null
          website_link: string | null
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string
          day_number: number
          description?: string | null
          estimated_cost?: number | null
          google_maps_link?: string | null
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
          tripadvisor_link?: string | null
          updated_at?: string
          user_id: string
          voucher_files?: Json | null
          waze_link?: string | null
          website_link?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          day_number?: number
          description?: string | null
          estimated_cost?: number | null
          google_maps_link?: string | null
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
          tripadvisor_link?: string | null
          updated_at?: string
          user_id?: string
          voucher_files?: Json | null
          waze_link?: string | null
          website_link?: string | null
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
      transport_bookings: {
        Row: {
          arrival_date: string | null
          arrival_location: string | null
          arrival_time: string | null
          booking_reference: string | null
          booking_status: string | null
          confirmation_number: string | null
          created_at: string
          currency: string | null
          departure_date: string | null
          departure_location: string | null
          departure_time: string | null
          description: string | null
          gate_info: string | null
          id: string
          notes: string | null
          payment_method: string | null
          provider_name: string | null
          seat_number: string | null
          ticket_file_name: string | null
          ticket_file_url: string | null
          title: string
          total_amount: number | null
          transport_type: string
          trip_id: string
          updated_at: string
          user_id: string
          vehicle_info: string | null
          voucher_file_name: string | null
          voucher_file_url: string | null
        }
        Insert: {
          arrival_date?: string | null
          arrival_location?: string | null
          arrival_time?: string | null
          booking_reference?: string | null
          booking_status?: string | null
          confirmation_number?: string | null
          created_at?: string
          currency?: string | null
          departure_date?: string | null
          departure_location?: string | null
          departure_time?: string | null
          description?: string | null
          gate_info?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          provider_name?: string | null
          seat_number?: string | null
          ticket_file_name?: string | null
          ticket_file_url?: string | null
          title: string
          total_amount?: number | null
          transport_type: string
          trip_id: string
          updated_at?: string
          user_id: string
          vehicle_info?: string | null
          voucher_file_name?: string | null
          voucher_file_url?: string | null
        }
        Update: {
          arrival_date?: string | null
          arrival_location?: string | null
          arrival_time?: string | null
          booking_reference?: string | null
          booking_status?: string | null
          confirmation_number?: string | null
          created_at?: string
          currency?: string | null
          departure_date?: string | null
          departure_location?: string | null
          departure_time?: string | null
          description?: string | null
          gate_info?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          provider_name?: string | null
          seat_number?: string | null
          ticket_file_name?: string | null
          ticket_file_url?: string | null
          title?: string
          total_amount?: number | null
          transport_type?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
          vehicle_info?: string | null
          voucher_file_name?: string | null
          voucher_file_url?: string | null
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
      trip_locations: {
        Row: {
          created_at: string
          id: string
          location_name: string
          location_type: string | null
          notes: string | null
          order_index: number | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_name: string
          location_type?: string | null
          notes?: string | null
          order_index?: number | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_name?: string
          location_type?: string | null
          notes?: string | null
          order_index?: number | null
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
          is_public: boolean
          public_slug: string | null
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
          is_public?: boolean
          public_slug?: string | null
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
          is_public?: boolean
          public_slug?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          total_budget?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_payment_methods: {
        Row: {
          color: string | null
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          trip_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          trip_id?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          trip_id?: string | null
          type?: string
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
      generate_trip_slug: {
        Args: { trip_title: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
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
