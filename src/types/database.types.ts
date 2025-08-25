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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      binder_cards: {
        Row: {
          binder_id: string
          card_id: string
          computed_price: number | null
          condition: Database["public"]["Enums"]["card_condition"]
          created_at: string
          finish: Database["public"]["Enums"]["card_finish"]
          fixed_price: number | null
          fx_multiplier: number | null
          id: string
          language: string | null
          last_priced_at: string | null
          listing_status: Database["public"]["Enums"]["listing_status"]
          price_mode: Database["public"]["Enums"]["price_mode"]
          quantity: number
          reserved_quantity: number
          tcg_basis: Database["public"]["Enums"]["tcg_basis"] | null
          updated_at: string
        }
        Insert: {
          binder_id: string
          card_id: string
          computed_price?: number | null
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          finish?: Database["public"]["Enums"]["card_finish"]
          fixed_price?: number | null
          fx_multiplier?: number | null
          id?: string
          language?: string | null
          last_priced_at?: string | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          price_mode?: Database["public"]["Enums"]["price_mode"]
          quantity: number
          reserved_quantity?: number
          tcg_basis?: Database["public"]["Enums"]["tcg_basis"] | null
          updated_at?: string
        }
        Update: {
          binder_id?: string
          card_id?: string
          computed_price?: number | null
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          finish?: Database["public"]["Enums"]["card_finish"]
          fixed_price?: number | null
          fx_multiplier?: number | null
          id?: string
          language?: string | null
          last_priced_at?: string | null
          listing_status?: Database["public"]["Enums"]["listing_status"]
          price_mode?: Database["public"]["Enums"]["price_mode"]
          quantity?: number
          reserved_quantity?: number
          tcg_basis?: Database["public"]["Enums"]["tcg_basis"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "binder_cards_binder_id_fkey"
            columns: ["binder_id"]
            isOneToOne: false
            referencedRelation: "binders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "binder_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["scryfall_id"]
          },
        ]
      }
      binders: {
        Row: {
          color_hex: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          owner_id: string
          pocket_layout: number | null
          privacy: Database["public"]["Enums"]["binder_privacy"]
          updated_at: string
        }
        Insert: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          owner_id: string
          pocket_layout?: number | null
          privacy?: Database["public"]["Enums"]["binder_privacy"]
          updated_at?: string
        }
        Update: {
          color_hex?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          owner_id?: string
          pocket_layout?: number | null
          privacy?: Database["public"]["Enums"]["binder_privacy"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "binders_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          collector_number: string
          created_at: string
          image_normal: string | null
          image_small: string | null
          name: string
          oracle_id: string | null
          scry_prices_updated_at: string | null
          scry_usd: number | null
          scry_usd_etched: number | null
          scry_usd_foil: number | null
          scryfall_id: string
          searchable: unknown | null
          set_code: string
          set_icon_svg_uri: string | null
          synced_at: string | null
          tcgplayer_product_id: number | null
          updated_at: string
        }
        Insert: {
          collector_number: string
          created_at?: string
          image_normal?: string | null
          image_small?: string | null
          name: string
          oracle_id?: string | null
          scry_prices_updated_at?: string | null
          scry_usd?: number | null
          scry_usd_etched?: number | null
          scry_usd_foil?: number | null
          scryfall_id: string
          searchable?: unknown | null
          set_code: string
          set_icon_svg_uri?: string | null
          synced_at?: string | null
          tcgplayer_product_id?: number | null
          updated_at?: string
        }
        Update: {
          collector_number?: string
          created_at?: string
          image_normal?: string | null
          image_small?: string | null
          name?: string
          oracle_id?: string | null
          scry_prices_updated_at?: string | null
          scry_usd?: number | null
          scry_usd_etched?: number | null
          scry_usd_foil?: number | null
          scryfall_id?: string
          searchable?: unknown | null
          set_code?: string
          set_icon_svg_uri?: string | null
          synced_at?: string | null
          tcgplayer_product_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          binder_card_id: string
          cart_id: string
          created_at: string
          id: string
          line_total: number | null
          price_snapshot: number
          quantity: number
          updated_at: string
        }
        Insert: {
          binder_card_id: string
          cart_id: string
          created_at?: string
          id?: string
          line_total?: number | null
          price_snapshot: number
          quantity: number
          updated_at?: string
        }
        Update: {
          binder_card_id?: string
          cart_id?: string
          created_at?: string
          id?: string
          line_total?: number | null
          price_snapshot?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_binder_card_id_fkey"
            columns: ["binder_card_id"]
            isOneToOne: false
            referencedRelation: "binder_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          seller_id: string
          status: Database["public"]["Enums"]["cart_status"]
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          seller_id: string
          status?: Database["public"]["Enums"]["cart_status"]
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["cart_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          user_id: string
        }
        Update: {
          conversation_id?: string
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
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_id: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_id?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_id?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: number
          sender_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: number
          sender_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: number
          sender_id?: string
          status?: string | null
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
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          conversation_id: string | null
          created_at: string
          id: number
          message_id: number | null
          offer_id: string | null
          order_id: string | null
          read_at: string | null
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          id?: number
          message_id?: number | null
          offer_id?: string | null
          order_id?: string | null
          read_at?: string | null
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          id?: number
          message_id?: number | null
          offer_id?: string | null
          order_id?: string | null
          read_at?: string | null
          type?: Database["public"]["Enums"]["notif_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_items: {
        Row: {
          binder_card_id: string | null
          card_id: string | null
          condition: Database["public"]["Enums"]["card_condition"]
          created_at: string
          finish: Database["public"]["Enums"]["card_finish"]
          id: string
          image_normal: string | null
          image_small: string | null
          language: string | null
          line_total: number | null
          name: string
          offer_id: string
          price_snapshot: number
          quantity: number
          set_code: string
          updated_at: string
        }
        Insert: {
          binder_card_id?: string | null
          card_id?: string | null
          condition: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          finish: Database["public"]["Enums"]["card_finish"]
          id?: string
          image_normal?: string | null
          image_small?: string | null
          language?: string | null
          line_total?: number | null
          name: string
          offer_id: string
          price_snapshot: number
          quantity: number
          set_code: string
          updated_at?: string
        }
        Update: {
          binder_card_id?: string | null
          card_id?: string | null
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          finish?: Database["public"]["Enums"]["card_finish"]
          id?: string
          image_normal?: string | null
          image_small?: string | null
          language?: string | null
          line_total?: number | null
          name?: string
          offer_id?: string
          price_snapshot?: number
          quantity?: number
          set_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_items_binder_card_id_fkey"
            columns: ["binder_card_id"]
            isOneToOne: false
            referencedRelation: "binder_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["scryfall_id"]
          },
          {
            foreignKeyName: "offer_items_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          accepted_at: string | null
          buyer_id: string
          cancelled_at: string | null
          created_at: string
          declined_at: string | null
          expires_at: string | null
          id: string
          message: string | null
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          buyer_id: string
          cancelled_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          buyer_id?: string
          cancelled_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oracles: {
        Row: {
          last_synced_at: string | null
          name: string | null
          oracle_id: string
          prints_count: number
        }
        Insert: {
          last_synced_at?: string | null
          name?: string | null
          oracle_id: string
          prints_count?: number
        }
        Update: {
          last_synced_at?: string | null
          name?: string | null
          oracle_id?: string
          prints_count?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          binder_card_id: string | null
          card_id: string | null
          condition: Database["public"]["Enums"]["card_condition"]
          created_at: string
          finish: Database["public"]["Enums"]["card_finish"]
          id: string
          image_normal: string | null
          image_small: string | null
          language: string | null
          line_total: number | null
          name: string
          order_id: string
          price_snapshot: number
          quantity: number
          set_code: string
          updated_at: string
        }
        Insert: {
          binder_card_id?: string | null
          card_id?: string | null
          condition: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          finish: Database["public"]["Enums"]["card_finish"]
          id?: string
          image_normal?: string | null
          image_small?: string | null
          language?: string | null
          line_total?: number | null
          name: string
          order_id: string
          price_snapshot: number
          quantity: number
          set_code: string
          updated_at?: string
        }
        Update: {
          binder_card_id?: string | null
          card_id?: string | null
          condition?: Database["public"]["Enums"]["card_condition"]
          created_at?: string
          finish?: Database["public"]["Enums"]["card_finish"]
          id?: string
          image_normal?: string | null
          image_small?: string | null
          language?: string | null
          line_total?: number | null
          name?: string
          order_id?: string
          price_snapshot?: number
          quantity?: number
          set_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_binder_card_id_fkey"
            columns: ["binder_card_id"]
            isOneToOne: false
            referencedRelation: "binder_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["scryfall_id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          cancelled_at: string | null
          created_at: string
          fulfilled_at: string | null
          id: string
          offer_id: string | null
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          seller_id: string
          shipping_status: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          cancelled_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          offer_id?: string | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          seller_id: string
          shipping_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          cancelled_at?: string | null
          created_at?: string
          fulfilled_at?: string | null
          id?: string
          offer_id?: string | null
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          seller_id?: string
          shipping_status?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: number
          order_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: number
          order_id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: number
          order_id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tcg_prices: {
        Row: {
          captured_at: string
          captured_hour_key: number
          created_at: string
          currency: string
          high: number | null
          id: number
          low: number | null
          market: number | null
          median: number | null
          tcg_product_id: number
          updated_at: string
        }
        Insert: {
          captured_at?: string
          captured_hour_key: number
          created_at?: string
          currency?: string
          high?: number | null
          id?: number
          low?: number | null
          market?: number | null
          median?: number | null
          tcg_product_id: number
          updated_at?: string
        }
        Update: {
          captured_at?: string
          captured_hour_key?: number
          created_at?: string
          currency?: string
          high?: number | null
          id?: number
          low?: number | null
          market?: number | null
          median?: number | null
          tcg_product_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          facebook_url: string | null
          first_name: string | null
          id: string
          image_url: string | null
          isverified: boolean | null
          last_name: string | null
          location: string | null
          reputation: number | null
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id: string
          image_url?: string | null
          isverified?: boolean | null
          last_name?: string | null
          location?: string | null
          reputation?: number | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          facebook_url?: string | null
          first_name?: string | null
          id?: string
          image_url?: string | null
          isverified?: boolean | null
          last_name?: string | null
          location?: string | null
          reputation?: number | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_binder: {
        Args: { b_id: string }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { c_id: string }
        Returns: boolean
      }
      username_available: {
        Args: { u: string }
        Returns: boolean
      }
    }
    Enums: {
      binder_privacy: "public" | "unlisted" | "private"
      card_condition: "NM" | "LP" | "MP" | "HP" | "DMG"
      card_finish: "non_foil" | "foil" | "etched"
      cart_status: "active" | "checked_out" | "abandoned"
      listing_status: "available" | "reserved" | "sold" | "archived"
      notif_type:
        | "offer_created"
        | "offer_status"
        | "order_status"
        | "message"
        | "dib_event"
      offer_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "expired"
      order_status: "pending" | "paid" | "cancelled" | "fulfilled"
      payment_status: "unpaid" | "paid" | "refunded"
      price_mode: "fixed" | "scryfall"
      tcg_basis: "listed_median" | "market" | "high" | "low"
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
      binder_privacy: ["public", "unlisted", "private"],
      card_condition: ["NM", "LP", "MP", "HP", "DMG"],
      card_finish: ["non_foil", "foil", "etched"],
      cart_status: ["active", "checked_out", "abandoned"],
      listing_status: ["available", "reserved", "sold", "archived"],
      notif_type: [
        "offer_created",
        "offer_status",
        "order_status",
        "message",
        "dib_event",
      ],
      offer_status: ["pending", "accepted", "declined", "cancelled", "expired"],
      order_status: ["pending", "paid", "cancelled", "fulfilled"],
      payment_status: ["unpaid", "paid", "refunded"],
      price_mode: ["fixed", "scryfall"],
      tcg_basis: ["listed_median", "market", "high", "low"],
    },
  },
} as const
