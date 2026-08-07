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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      "Al Fatah Leads Ad Data": {
        Row: {
          ad_id: string | null
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          created_time: string | null
          email: string | null
          form_id: string | null
          form_name: string | null
          full_name: string | null
          id: string
          inbox_url: string | null
          inserted_at: string | null
          is_organic: boolean | null
          lead_status: string | null
          phone_number: string | null
          platform: string | null
          "what_is_your_required_water_capacity?": string | null
          "what_type_of_business_do_you_have?": string | null
          "what_water_treatment_solution_are_you_looking_for?": string | null
        }
        Insert: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_time?: string | null
          email?: string | null
          form_id?: string | null
          form_name?: string | null
          full_name?: string | null
          id: string
          inbox_url?: string | null
          inserted_at?: string | null
          is_organic?: boolean | null
          lead_status?: string | null
          phone_number?: string | null
          platform?: string | null
          "what_is_your_required_water_capacity?"?: string | null
          "what_type_of_business_do_you_have?"?: string | null
          "what_water_treatment_solution_are_you_looking_for?"?: string | null
        }
        Update: {
          ad_id?: string | null
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          created_time?: string | null
          email?: string | null
          form_id?: string | null
          form_name?: string | null
          full_name?: string | null
          id?: string
          inbox_url?: string | null
          inserted_at?: string | null
          is_organic?: boolean | null
          lead_status?: string | null
          phone_number?: string | null
          platform?: string | null
          "what_is_your_required_water_capacity?"?: string | null
          "what_type_of_business_do_you_have?"?: string | null
          "what_water_treatment_solution_are_you_looking_for?"?: string | null
        }
        Relationships: []
      }
      government_institutions: {
        Row: {
          contact_info: string | null
          district: Database["public"]["Enums"]["district_name"]
          id: string
          name: string
        }
        Insert: {
          contact_info?: string | null
          district: Database["public"]["Enums"]["district_name"]
          id?: string
          name: string
        }
        Update: {
          contact_info?: string | null
          district?: Database["public"]["Enums"]["district_name"]
          id?: string
          name?: string
        }
        Relationships: []
      }
      imports: {
        Row: {
          country: string
          created_at: string
          created_by: string
          currency: string
          expected_arrival: string | null
          id: string
          import_date: string
          invoice_no: string | null
          product_id: string
          quantity: number
          region_id: string
          supplier: string
          total_cost: number
          unit_cost: number
          updated_at: string
        }
        Insert: {
          country: string
          created_at?: string
          created_by: string
          currency?: string
          expected_arrival?: string | null
          id?: string
          import_date: string
          invoice_no?: string | null
          product_id: string
          quantity: number
          region_id: string
          supplier: string
          total_cost: number
          unit_cost: number
          updated_at?: string
        }
        Update: {
          country?: string
          created_at?: string
          created_by?: string
          currency?: string
          expected_arrival?: string | null
          id?: string
          import_date?: string
          invoice_no?: string | null
          product_id?: string
          quantity?: number
          region_id?: string
          supplier?: string
          total_cost?: number
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imports_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          quantity_available: number
          region_id: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity_available?: number
          region_id: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity_available?: number
          region_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      leads_calling_list: {
        Row: {
          call_date: string | null
          capacity: string | null
          company_type: string | null
          contact_num: string | null
          email: string | null
          id: number
          inserted_at: string | null
          person_name: string | null
          plant_type: string | null
          remarks: string | null
          remarks_2: string | null
          remarks_3: string | null
          row_color: string | null
          s_no: number | null
        }
        Insert: {
          call_date?: string | null
          capacity?: string | null
          company_type?: string | null
          contact_num?: string | null
          email?: string | null
          id?: never
          inserted_at?: string | null
          person_name?: string | null
          plant_type?: string | null
          remarks?: string | null
          remarks_2?: string | null
          remarks_3?: string | null
          row_color?: string | null
          s_no?: number | null
        }
        Update: {
          call_date?: string | null
          capacity?: string | null
          company_type?: string | null
          contact_num?: string | null
          email?: string | null
          id?: never
          inserted_at?: string | null
          person_name?: string | null
          plant_type?: string | null
          remarks?: string | null
          remarks_2?: string | null
          remarks_3?: string | null
          row_color?: string | null
          s_no?: number | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          description: string | null
          id: string
          name: string
          unit: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          name: string
          unit?: string
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          name?: string
          unit?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          region_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["account_status"]
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          region_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          region_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["account_status"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          created_by: string
          id: string
          institution_id: string
          product_id: string
          quantity: number
          region_id: string
          sale_date: string
          status: Database["public"]["Enums"]["sale_status"]
          total_price: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          institution_id: string
          product_id: string
          quantity: number
          region_id: string
          sale_date: string
          status?: Database["public"]["Enums"]["sale_status"]
          total_price: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          institution_id?: string
          product_id?: string
          quantity?: number
          region_id?: string
          sale_date?: string
          status?: Database["public"]["Enums"]["sale_status"]
          total_price?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "government_institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_sync_logs: {
        Row: {
          id: string
          rows_synced: number
          source: string
          status: Database["public"]["Enums"]["sync_status"]
          synced_at: string
        }
        Insert: {
          id?: string
          rows_synced?: number
          source: string
          status: Database["public"]["Enums"]["sync_status"]
          synced_at?: string
        }
        Update: {
          id?: string
          rows_synced?: number
          source?: string
          status?: Database["public"]["Enums"]["sync_status"]
          synced_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_region: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      account_status: "active" | "suspended"
      district_name: "Jamshoro" | "Tharparkar" | "Umerkot"
      sale_status: "pending" | "dispatched" | "delivered"
      sync_status: "success" | "partial" | "failed"
      user_role: "super_admin" | "admin" | "user"
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
      account_status: ["active", "suspended"],
      district_name: ["Jamshoro", "Tharparkar", "Umerkot"],
      sale_status: ["pending", "dispatched", "delivered"],
      sync_status: ["success", "partial", "failed"],
      user_role: ["super_admin", "admin", "user"],
    },
  },
} as const

// Custom app-level type (not part of the Supabase-generated schema above).
// Used by lib/auth.ts's requireProfile(). Re-add this line any time you
// regenerate this file with `supabase gen types`, since that command
// overwrites the whole file.
export type Profile = Tables<"profiles">