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
      contributions: {
        Row: {
          amount: number
          created_at: string
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
          due_date?: string
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
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
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Functions: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      app_role: "super_admin" | "admin" | "moderator" | "user" | "investor"
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
      app_role: ["super_admin", "admin", "moderator", "user", "investor"],
    },
  },
} as const
