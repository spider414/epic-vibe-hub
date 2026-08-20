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
      bookings: {
        Row: {
          alt_date: string | null
          attachments: Json
          balance_amount: number | null
          booking_type: string
          budget: string | null
          contact_method: string
          created_at: string
          deposit_amount: number | null
          deposit_status: string
          details: string | null
          duration: string | null
          email: string
          event_type: string | null
          full_name: string
          guest_count: number | null
          id: string
          internal_notes: string | null
          location: string | null
          occasion: string | null
          organisation: string | null
          package_name: string | null
          phone: string
          preferred_date: string | null
          quote_amount: number | null
          quote_notes: string | null
          reference: string | null
          services: string[]
          status: string
          updated_at: string
        }
        Insert: {
          alt_date?: string | null
          attachments?: Json
          balance_amount?: number | null
          booking_type?: string
          budget?: string | null
          contact_method?: string
          created_at?: string
          deposit_amount?: number | null
          deposit_status?: string
          details?: string | null
          duration?: string | null
          email: string
          event_type?: string | null
          full_name: string
          guest_count?: number | null
          id?: string
          internal_notes?: string | null
          location?: string | null
          occasion?: string | null
          organisation?: string | null
          package_name?: string | null
          phone: string
          preferred_date?: string | null
          quote_amount?: number | null
          quote_notes?: string | null
          reference?: string | null
          services?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          alt_date?: string | null
          attachments?: Json
          balance_amount?: number | null
          booking_type?: string
          budget?: string | null
          contact_method?: string
          created_at?: string
          deposit_amount?: number | null
          deposit_status?: string
          details?: string | null
          duration?: string | null
          email?: string
          event_type?: string | null
          full_name?: string
          guest_count?: number | null
          id?: string
          internal_notes?: string | null
          location?: string | null
          occasion?: string | null
          organisation?: string | null
          package_name?: string | null
          phone?: string
          preferred_date?: string | null
          quote_amount?: number | null
          quote_notes?: string | null
          reference?: string | null
          services?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      dance_bookings: {
        Row: {
          amount_paid: number | null
          assigned_dancers: string[]
          attachments: Json
          balance_amount: number | null
          budget: string | null
          created_at: string
          dance_style: string | null
          dancers_count: number | null
          details: string | null
          duration: string | null
          email: string
          event_date: string | null
          event_type: string | null
          full_name: string
          id: string
          internal_notes: string | null
          location: string | null
          needs_choreography: boolean
          needs_classes: boolean
          payment_status: string
          phone: string
          quote_amount: number | null
          reference: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_paid?: number | null
          assigned_dancers?: string[]
          attachments?: Json
          balance_amount?: number | null
          budget?: string | null
          created_at?: string
          dance_style?: string | null
          dancers_count?: number | null
          details?: string | null
          duration?: string | null
          email: string
          event_date?: string | null
          event_type?: string | null
          full_name: string
          id?: string
          internal_notes?: string | null
          location?: string | null
          needs_choreography?: boolean
          needs_classes?: boolean
          payment_status?: string
          phone: string
          quote_amount?: number | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_paid?: number | null
          assigned_dancers?: string[]
          attachments?: Json
          balance_amount?: number | null
          budget?: string | null
          created_at?: string
          dance_style?: string | null
          dancers_count?: number | null
          details?: string | null
          duration?: string | null
          email?: string
          event_date?: string | null
          event_type?: string | null
          full_name?: string
          id?: string
          internal_notes?: string | null
          location?: string | null
          needs_choreography?: boolean
          needs_classes?: boolean
          payment_status?: string
          phone?: string
          quote_amount?: number | null
          reference?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      dancers: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          instagram: string | null
          is_active: boolean
          name: string
          photo_url: string | null
          sort_order: number
          stage_role: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          name: string
          photo_url?: string | null
          sort_order?: number
          stage_role?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          instagram?: string | null
          is_active?: boolean
          name?: string
          photo_url?: string | null
          sort_order?: number
          stage_role?: string | null
        }
        Relationships: []
      }
      enquiries: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          status: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          status?: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          status?: string
          subject?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          address: string | null
          age_limit: string | null
          capacity: number | null
          category: string
          city: string
          created_at: string
          description: string
          dress_code: string | null
          ends_at: string | null
          flyer_url: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          map_query: string | null
          price_regular: number
          price_vip: number | null
          rules: string | null
          slug: string
          starts_at: string
          status: string
          tickets_sold: number
          title: string
          updated_at: string
          venue: string
        }
        Insert: {
          address?: string | null
          age_limit?: string | null
          capacity?: number | null
          category?: string
          city?: string
          created_at?: string
          description?: string
          dress_code?: string | null
          ends_at?: string | null
          flyer_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          map_query?: string | null
          price_regular?: number
          price_vip?: number | null
          rules?: string | null
          slug: string
          starts_at: string
          status?: string
          tickets_sold?: number
          title: string
          updated_at?: string
          venue?: string
        }
        Update: {
          address?: string | null
          age_limit?: string | null
          capacity?: number | null
          category?: string
          city?: string
          created_at?: string
          description?: string
          dress_code?: string | null
          ends_at?: string | null
          flyer_url?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          map_query?: string | null
          price_regular?: number
          price_vip?: number | null
          rules?: string | null
          slug?: string
          starts_at?: string
          status?: string
          tickets_sold?: number
          title?: string
          updated_at?: string
          venue?: string
        }
        Relationships: []
      }
      media: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          is_visible: boolean
          media_type: string
          sort_order: number
          tag: string | null
          thumbnail_url: string | null
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_visible?: boolean
          media_type?: string
          sort_order?: number
          tag?: string | null
          thumbnail_url?: string | null
          title: string
          url: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          is_visible?: boolean
          media_type?: string
          sort_order?: number
          tag?: string | null
          thumbnail_url?: string | null
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          category: string
          created_at: string
          features: string[]
          id: string
          is_active: boolean
          name: string
          price_from: number | null
          price_note: string | null
          sort_order: number
          tagline: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          features?: string[]
          id?: string
          is_active?: boolean
          name: string
          price_from?: number | null
          price_note?: string | null
          sort_order?: number
          tagline?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          features?: string[]
          id?: string
          is_active?: boolean
          name?: string
          price_from?: number | null
          price_note?: string | null
          sort_order?: number
          tagline?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          author_name: string
          author_role: string | null
          avatar_url: string | null
          created_at: string
          id: string
          is_approved: boolean
          message: string
          rating: number
        }
        Insert: {
          author_name: string
          author_role?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          message: string
          rating?: number
        }
        Update: {
          author_name?: string
          author_role?: string | null
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          message?: string
          rating?: number
        }
        Relationships: []
      }
      ticket_orders: {
        Row: {
          access_token: string
          amount_total: number
          created_at: string
          customer_name: string
          email: string
          event_id: string | null
          id: string
          notes: string | null
          order_number: string | null
          paid_at: string | null
          payment_provider: string
          payment_status: string
          phone: string
          provider_reference: string | null
          quantity: number
          reference: string
          ticket_type: string
          ticket_type_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string
          amount_total?: number
          created_at?: string
          customer_name: string
          email: string
          event_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_provider?: string
          payment_status?: string
          phone: string
          provider_reference?: string | null
          quantity?: number
          reference?: string
          ticket_type?: string
          ticket_type_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string
          amount_total?: number
          created_at?: string
          customer_name?: string
          email?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string | null
          paid_at?: string | null
          payment_provider?: string
          payment_status?: string
          phone?: string
          provider_reference?: string | null
          quantity?: number
          reference?: string
          ticket_type?: string
          ticket_type_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_orders_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
          price: number
          quantity_sold: number
          quantity_total: number | null
          sale_ends_at: string | null
          sale_starts_at: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          price?: number
          quantity_sold?: number
          quantity_total?: number | null
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          price?: number
          quantity_sold?: number
          quantity_total?: number | null
          sale_ends_at?: string | null
          sale_starts_at?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          checked_in_at: string | null
          created_at: string
          event_id: string | null
          holder_name: string | null
          id: string
          order_id: string
          serial: number
          status: string
          ticket_code: string
          ticket_type_id: string | null
        }
        Insert: {
          checked_in_at?: string | null
          created_at?: string
          event_id?: string | null
          holder_name?: string | null
          id?: string
          order_id: string
          serial?: number
          status?: string
          ticket_code?: string
          ticket_type_id?: string | null
        }
        Update: {
          checked_in_at?: string | null
          created_at?: string
          event_id?: string | null
          holder_name?: string | null
          id?: string
          order_id?: string
          serial?: number
          status?: string
          ticket_code?: string
          ticket_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      create_booking: { Args: { _payload: Json }; Returns: string }
      create_dance_booking: { Args: { _payload: Json }; Returns: string }
      get_order_by_token: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "user"
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
      app_role: ["admin", "staff", "user"],
    },
  },
} as const
