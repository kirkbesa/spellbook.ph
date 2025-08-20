// src/types/types.ts

import type { Database as GeneratedDatabase, Json } from './database.types'
import type { SupabaseClient as SupabaseClientBase } from '@supabase/supabase-js'

/** Re-export the generated Database + Json */
export type Database = GeneratedDatabase
export type { Json }

/** Typed Supabase client */
export type SupabaseClient = SupabaseClientBase<Database>

/* ----------------------------------------------------------------------------
 * Public schema shortcuts
 * --------------------------------------------------------------------------*/
type Public = Database['public']
type PublicTables = Public['Tables']
// type PublicViews = Public['Views']
type PublicEnums = Public['Enums']

export type PublicTableName = keyof PublicTables

export type Row<T extends PublicTableName> = PublicTables[T] extends { Row: infer R } ? R : never

export type Insert<T extends PublicTableName> = PublicTables[T] extends { Insert: infer I }
    ? I
    : never

export type Update<T extends PublicTableName> = PublicTables[T] extends { Update: infer U }
    ? U
    : never

export type Enum<E extends keyof PublicEnums> = PublicEnums[E]

/* ----------------------------------------------------------------------------
 * Cross-schema helpers (if you also generated storage/auth/etc.)
 * Avoid internal keys like __InternalSupabase.
 * --------------------------------------------------------------------------*/
type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase' | '__supabase'>
export type SchemaName = keyof DatabaseWithoutInternals

type TablesAndViews<S extends SchemaName> = DatabaseWithoutInternals[S] extends {
    Tables: infer T
    Views: infer V
}
    ? T & V
    : never

type TablesOnly<S extends SchemaName> = DatabaseWithoutInternals[S] extends { Tables: infer T }
    ? T
    : never

export type TableRow<
    S extends SchemaName,
    T extends keyof TablesAndViews<S>,
> = TablesAndViews<S>[T] extends { Row: infer R } ? R : never

export type TableInsert<
    S extends SchemaName,
    T extends keyof TablesOnly<S>,
> = TablesOnly<S>[T] extends { Insert: infer I } ? I : never

export type TableUpdate<
    S extends SchemaName,
    T extends keyof TablesOnly<S>,
> = TablesOnly<S>[T] extends { Update: infer U } ? U : never

export type SchemaEnum<
    S extends SchemaName,
    E extends keyof DatabaseWithoutInternals[S]['Enums'],
> = DatabaseWithoutInternals[S]['Enums'][E]

/* ----------------------------------------------------------------------------
 * Convenience aliases for your public tables (optional)
 * --------------------------------------------------------------------------*/
export type User = Row<'users'>
export type Card = Row<'cards'>
export type Binder = Row<'binders'>
export type BinderCard = Row<'binder_cards'>
export type Cart = Row<'carts'>
export type CartItem = Row<'cart_items'>
export type Offer = Row<'offers'>
export type OfferItem = Row<'offer_items'>
export type Order = Row<'orders'>
export type OrderItem = Row<'order_items'>
export type Conversation = Row<'conversations'>
export type ConversationParticipant = Row<'conversation_participants'>
export type Message = Row<'messages'>
export type Notification = Row<'notifications'>
export type Review = Row<'reviews'>
export type TcgPrice = Row<'tcg_prices'>
