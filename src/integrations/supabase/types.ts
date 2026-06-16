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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      contribution_payments: {
        Row: {
          admin_note: string | null
          amount: number
          category_id: string
          contribution_id: string
          created_at: string
          cycle_id: string | null
          id: string
          payment_date: string
          payment_method_id: string | null
          payment_reference: string | null
          proof_url: string | null
          status: string
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          category_id: string
          contribution_id: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          payment_date?: string
          payment_method_id?: string | null
          payment_reference?: string | null
          proof_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          category_id?: string
          contribution_id?: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          payment_date?: string
          payment_method_id?: string | null
          payment_reference?: string | null
          proof_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contribution_payments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tontine_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_payments_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "tontine_contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_payments_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "tontine_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contribution_payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      contribution_reminders: {
        Row: {
          contribution_id: string | null
          created_at: string
          id: string
          message: string
          reminder_date: string
          scheduled_at: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          contribution_id?: string | null
          created_at?: string
          id?: string
          message: string
          reminder_date: string
          scheduled_at: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          contribution_id?: string | null
          created_at?: string
          id?: string
          message?: string
          reminder_date?: string
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contribution_reminders_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "tontine_contributions"
            referencedColumns: ["id"]
          },
        ]
      }
      contributions: {
        Row: {
          amount: number
          created_at: string
          cycle_id: string | null
          due_date: string
          id: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          cycle_id?: string | null
          due_date: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          cycle_id?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "tontine_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cycles: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          group_id: string | null
          id: string
          name: string
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          name: string
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string
        }
        Relationships: []
      }
      financing_requests: {
        Row: {
          admin_notes: string | null
          amount_requested: number
          category: string
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          project_description: string
          project_type: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount_requested: number
          category: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone: string
          project_description: string
          project_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount_requested?: number
          category?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string
          project_description?: string
          project_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_tontine_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          is_active: boolean
          joined_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          joined_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_tontine_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tontine_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          provider: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          provider?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          provider?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          email: string | null
          email_notifications: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          marketing_notifications: boolean | null
          phone: string | null
          profession: string | null
          recommended_category: string | null
          reminder_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_notifications?: boolean | null
          phone?: string | null
          profession?: string | null
          recommended_category?: string | null
          reminder_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          marketing_notifications?: boolean | null
          phone?: string | null
          profession?: string | null
          recommended_category?: string | null
          reminder_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tontine_categories: {
        Row: {
          created_at: string
          currency: string
          daily_amount: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          daily_amount: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          daily_amount?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tontine_contributions: {
        Row: {
          category_id: string
          created_at: string
          cycle_id: string | null
          due_date: string
          expected_amount: number
          id: string
          paid_amount: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          cycle_id?: string | null
          due_date: string
          expected_amount: number
          id?: string
          paid_amount?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          cycle_id?: string | null
          due_date?: string
          expected_amount?: number
          id?: string
          paid_amount?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_contributions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tontine_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_contributions_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "tontine_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_cycles: {
        Row: {
          contribution_amount: number
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          contribution_amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          contribution_amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          payment_method: string
          phone: string
          receipt_storage_path: string | null
          receipt_url: string | null
          reference: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          payment_method: string
          phone: string
          receipt_storage_path?: string | null
          receipt_url?: string | null
          reference: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          payment_method?: string
          phone?: string
          receipt_storage_path?: string | null
          receipt_url?: string | null
          reference?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      member_directory: {
        Row: {
          avatar_url: string | null
          city: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          profession: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profession?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profession?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      member_directory_public: {
        Row: {
          avatar_url: string | null
          city: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          profession: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profession?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          profession?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_assign_user_role: {
        Args: {
          p_email?: string
          p_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: {
          created_at: string
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_roles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_delete_member_profile: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      admin_list_members_enriched: {
        Args: never
        Returns: {
          avatar_url: string
          city: string
          email: string
          financing_statuses: string[]
          first_name: string
          has_active_tontine: boolean
          has_contributions: boolean
          has_declared_payment: boolean
          has_financing_request: boolean
          has_overdue_contribution: boolean
          has_validated_payment: boolean
          id: string
          last_name: string
          profession: string
          recommended_category: string
          role: string
          tontine_category_names: string[]
          user_id: string
        }[]
      }
      admin_update_member_profile: {
        Args: {
          p_avatar_url?: string
          p_city?: string
          p_email?: string
          p_first_name?: string
          p_last_name?: string
          p_phone?: string
          p_profession?: string
          target_user_id: string
        }
        Returns: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          email: string | null
          email_notifications: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          marketing_notifications: boolean | null
          phone: string | null
          profession: string | null
          recommended_category: string | null
          reminder_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_validate_tontine_payment: {
        Args: { p_admin_note: string; p_payment_id: string; p_status: string }
        Returns: boolean
      }
      close_daily_tontine_contributions: {
        Args: { p_target_date: string }
        Returns: number
      }
      create_transaction: {
        Args: {
          _amount: number
          _category: string
          _email: string
          _full_name: string
          _payment_method: string
          _phone: string
          _reference: string
        }
        Returns: string
      }
      current_user_is_admin_or_super_admin: { Args: never; Returns: boolean }
      current_user_is_super_admin: { Args: never; Returns: boolean }
      generate_daily_tontine_contributions: {
        Args: { p_target_date: string }
        Returns: number
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | {
            Args: { required_role: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
      is_admin_or_super_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      member_declare_tontine_payment: {
        Args: {
          p_amount: number
          p_contribution_id: string
          p_payment_method_id: string
          p_payment_reference?: string
          p_proof_url?: string
        }
        Returns: string
      }
      member_select_tontine_category: {
        Args: { p_category_id: string }
        Returns: string
      }
      member_unselect_tontine_category: {
        Args: { p_category_id: string }
        Returns: boolean
      }
      run_daily_tontine_maintenance: {
        Args: {
          p_close_date: string
          p_dry_run?: boolean
          p_generate_date: string
        }
        Returns: Json
      }
      submit_financing_request: {
        Args: {
          _amount_requested: number
          _category: string
          _email: string
          _full_name: string
          _phone: string
          _project_description: string
          _project_type: string
        }
        Returns: string
      }
      verify_transaction_by_reference: {
        Args: { _reference: string }
        Returns: {
          amount: number
          category: string
          created_at: string
          full_name: string
          payment_method: string
          receipt_url: string
          reference: string
          status: string
          transaction_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "investor" | "super_admin"
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
      app_role: ["admin", "moderator", "user", "investor", "super_admin"],
    },
  },
} as const
