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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      auth_logs: {
        Row: {
          duration: number | null
          email: string
          error_message: string | null
          final_url: string | null
          id: string
          session_id: string | null
          success: boolean
          timestamp: string
          user_id: string
        }
        Insert: {
          duration?: number | null
          email: string
          error_message?: string | null
          final_url?: string | null
          id?: string
          session_id?: string | null
          success: boolean
          timestamp?: string
          user_id: string
        }
        Update: {
          duration?: number | null
          email?: string
          error_message?: string | null
          final_url?: string | null
          id?: string
          session_id?: string | null
          success?: boolean
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      autocomplete_cache: {
        Row: {
          cached_at: string
          expires_at: string
          id: string
          locale: string
          query: string
          query_key: string
          results: Json
        }
        Insert: {
          cached_at?: string
          expires_at: string
          id: string
          locale?: string
          query: string
          query_key: string
          results: Json
        }
        Update: {
          cached_at?: string
          expires_at?: string
          id?: string
          locale?: string
          query?: string
          query_key?: string
          results?: Json
        }
        Relationships: []
      }
      destination_cache: {
        Row: {
          created_at: string
          destination_name: string
          id: string
          last_verified: string
          region_id: number
          region_name: string | null
        }
        Insert: {
          created_at?: string
          destination_name: string
          id: string
          last_verified?: string
          region_id: number
          region_name?: string | null
        }
        Update: {
          created_at?: string
          destination_name?: string
          id?: string
          last_verified?: string
          region_id?: number
          region_name?: string | null
        }
        Relationships: []
      }
      dump_metadata: {
        Row: {
          created_at: string
          dump_type: string
          dump_version: string
          error_message: string | null
          id: string
          last_download: string
          last_update: string
          record_count: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dump_type: string
          dump_version: string
          error_message?: string | null
          id: string
          last_download: string
          last_update: string
          record_count: number
          status: string
          updated_at: string
        }
        Update: {
          created_at?: string
          dump_type?: string
          dump_version?: string
          error_message?: string | null
          id?: string
          last_download?: string
          last_update?: string
          record_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotel_dump_data: {
        Row: {
          address: string | null
          amenities: Json
          amenity_groups: Json
          check_in_time: string | null
          check_out_time: string | null
          city: string | null
          country: string | null
          description: string | null
          description_struct: Json | null
          dump_version: string | null
          email: string | null
          facts: Json | null
          hotel_id: string
          id: string
          images: Json
          imported_at: string
          kind: string | null
          language: string
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
          policy_struct: Json | null
          postal_code: string | null
          raw_data: Json
          room_groups: Json
          star_rating: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          amenities?: Json
          amenity_groups?: Json
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          country?: string | null
          description?: string | null
          description_struct?: Json | null
          dump_version?: string | null
          email?: string | null
          facts?: Json | null
          hotel_id: string
          id: string
          images?: Json
          imported_at?: string
          kind?: string | null
          language?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          policy_struct?: Json | null
          postal_code?: string | null
          raw_data: Json
          room_groups?: Json
          star_rating?: number | null
          updated_at: string
        }
        Update: {
          address?: string | null
          amenities?: Json
          amenity_groups?: Json
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string | null
          country?: string | null
          description?: string | null
          description_struct?: Json | null
          dump_version?: string | null
          email?: string | null
          facts?: Json | null
          hotel_id?: string
          id?: string
          images?: Json
          imported_at?: string
          kind?: string | null
          language?: string
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
          policy_struct?: Json | null
          postal_code?: string | null
          raw_data?: Json
          room_groups?: Json
          star_rating?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      hotel_pois: {
        Row: {
          distance_m: number
          hotel_id: string
          id: string
          poi_name: string
          poi_name_en: string
          poi_subtype: string
          poi_type: string
        }
        Insert: {
          distance_m: number
          hotel_id: string
          id: string
          poi_name: string
          poi_name_en: string
          poi_subtype: string
          poi_type: string
        }
        Update: {
          distance_m?: number
          hotel_id?: string
          id?: string
          poi_name?: string
          poi_name_en?: string
          poi_subtype?: string
          poi_type?: string
        }
        Relationships: []
      }
      hotel_reviews: {
        Row: {
          created_at: string
          dump_version: string | null
          helpful_count: number
          hotel_id: string
          id: string
          language: string
          rating: number
          review_date: string
          review_text: string
          reviewer_name: string | null
        }
        Insert: {
          created_at?: string
          dump_version?: string | null
          helpful_count?: number
          hotel_id: string
          id: string
          language?: string
          rating: number
          review_date: string
          review_text: string
          reviewer_name?: string | null
        }
        Update: {
          created_at?: string
          dump_version?: string | null
          helpful_count?: number
          hotel_id?: string
          id?: string
          language?: string
          rating?: number
          review_date?: string
          review_text?: string
          reviewer_name?: string | null
        }
        Relationships: []
      }
      hotel_static_cache: {
        Row: {
          address: string | null
          amenities: Json | null
          cached_at: string
          city: string | null
          coordinates: Json | null
          country: string | null
          description: string | null
          expires_at: string
          hotel_id: string
          id: string
          images: Json | null
          language: string
          name: string | null
          raw_data: Json | null
          star_rating: number | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          cached_at?: string
          city?: string | null
          coordinates?: Json | null
          country?: string | null
          description?: string | null
          expires_at: string
          hotel_id: string
          id: string
          images?: Json | null
          language?: string
          name?: string | null
          raw_data?: Json | null
          star_rating?: number | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          cached_at?: string
          city?: string | null
          coordinates?: Json | null
          country?: string | null
          description?: string | null
          expires_at?: string
          hotel_id?: string
          id?: string
          images?: Json | null
          language?: string
          name?: string | null
          raw_data?: Json | null
          star_rating?: number | null
        }
        Relationships: []
      }
      region_data: {
        Row: {
          country_code: string
          created_at: string
          dump_version: string | null
          iata: string | null
          id: number
          name: string
          parent_id: number | null
          type: string
        }
        Insert: {
          country_code: string
          created_at?: string
          dump_version?: string | null
          iata?: string | null
          id: number
          name: string
          parent_id?: number | null
          type: string
        }
        Update: {
          country_code?: string
          created_at?: string
          dump_version?: string | null
          iata?: string | null
          id?: number
          name?: string
          parent_id?: number | null
          type?: string
        }
        Relationships: []
      }
      search_cache: {
        Row: {
          cached_at: string
          etg_search_id: string | null
          expires_at: string
          hit_count: number
          hotel_ids: string[] | null
          id: string
          rates_index: Json
          region_id: number
          search_params: Json
          search_signature: string
          total_hotels: number
        }
        Insert: {
          cached_at?: string
          etg_search_id?: string | null
          expires_at: string
          hit_count?: number
          hotel_ids?: string[] | null
          id: string
          rates_index: Json
          region_id: number
          search_params: Json
          search_signature: string
          total_hotels: number
        }
        Update: {
          cached_at?: string
          etg_search_id?: string | null
          expires_at?: string
          hit_count?: number
          hotel_ids?: string[] | null
          id?: string
          rates_index?: Json
          region_id?: number
          search_params?: Json
          search_signature?: string
          total_hotels?: number
        }
        Relationships: []
      }
      static_data: {
        Row: {
          category: string
          code: string
          id: string
          translations: Json
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          id: string
          translations: Json
          updated_at: string
        }
        Update: {
          category?: string
          code?: string
          id?: string
          translations?: Json
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          actual_address_matches: boolean | null
          address: string | null
          agency_name: string | null
          city: string | null
          created_at: string
          dummy_email: string | null
          email: string
          email_verification: string | null
          first_name: string | null
          id: string
          itn: string | null
          last_login: string | null
          last_name: string | null
          legal_name: string | null
          logo_url: string | null
          otp: string | null
          password: string | null
          phone_number: string | null
          ratehawk_email: string | null
          status: string | null
        }
        Insert: {
          actual_address_matches?: boolean | null
          address?: string | null
          agency_name?: string | null
          city?: string | null
          created_at?: string
          dummy_email?: string | null
          email: string
          email_verification?: string | null
          first_name?: string | null
          id?: string
          itn?: string | null
          last_login?: string | null
          last_name?: string | null
          legal_name?: string | null
          logo_url?: string | null
          otp?: string | null
          password?: string | null
          phone_number?: string | null
          ratehawk_email?: string | null
          status?: string | null
        }
        Update: {
          actual_address_matches?: boolean | null
          address?: string | null
          agency_name?: string | null
          city?: string | null
          created_at?: string
          dummy_email?: string | null
          email?: string
          email_verification?: string | null
          first_name?: string | null
          id?: string
          itn?: string | null
          last_login?: string | null
          last_name?: string | null
          legal_name?: string | null
          logo_url?: string | null
          otp?: string | null
          password?: string | null
          phone_number?: string | null
          ratehawk_email?: string | null
          status?: string | null
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
