export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    // Allows to automatically instanciate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: '12.2.3 (519615d)'
    }
    public: {
        Tables: {
            clients: {
                Row: {
                    address_status: Database['public']['Enums']['address_status_enum'] | null
                    age: number | null
                    citizenship: string | null
                    civil_status: Database['public']['Enums']['civil_status_enum'] | null
                    created_at: string
                    date_of_birth: string | null
                    email: string
                    employer: string | null
                    employer_address: string | null
                    employer_nature_of_business: string | null
                    employer_status: Database['public']['Enums']['employer_status_enum'] | null
                    employment_address: string | null
                    home_address: string
                    id: string
                    mobile_number: string
                    name: string
                    place_of_birth: string | null
                    sex: Database['public']['Enums']['client_sex_enum'] | null
                    status: Database['public']['Enums']['client_status_enum']
                    telephone_number: string | null
                    tin: string | null
                    updated_at: string
                    valid_id: string | null
                }
                Insert: {
                    address_status?: Database['public']['Enums']['address_status_enum'] | null
                    age?: number | null
                    citizenship?: string | null
                    civil_status?: Database['public']['Enums']['civil_status_enum'] | null
                    created_at?: string
                    date_of_birth?: string | null
                    email: string
                    employer?: string | null
                    employer_address?: string | null
                    employer_nature_of_business?: string | null
                    employer_status?: Database['public']['Enums']['employer_status_enum'] | null
                    employment_address?: string | null
                    home_address: string
                    id?: string
                    mobile_number: string
                    name: string
                    place_of_birth?: string | null
                    sex?: Database['public']['Enums']['client_sex_enum'] | null
                    status: Database['public']['Enums']['client_status_enum']
                    telephone_number?: string | null
                    tin?: string | null
                    updated_at?: string
                    valid_id?: string | null
                }
                Update: {
                    address_status?: Database['public']['Enums']['address_status_enum'] | null
                    age?: number | null
                    citizenship?: string | null
                    civil_status?: Database['public']['Enums']['civil_status_enum'] | null
                    created_at?: string
                    date_of_birth?: string | null
                    email?: string
                    employer?: string | null
                    employer_address?: string | null
                    employer_nature_of_business?: string | null
                    employer_status?: Database['public']['Enums']['employer_status_enum'] | null
                    employment_address?: string | null
                    home_address?: string
                    id?: string
                    mobile_number?: string
                    name?: string
                    place_of_birth?: string | null
                    sex?: Database['public']['Enums']['client_sex_enum'] | null
                    status?: Database['public']['Enums']['client_status_enum']
                    telephone_number?: string | null
                    tin?: string | null
                    updated_at?: string
                    valid_id?: string | null
                }
                Relationships: []
            }
            commissions: {
                Row: {
                    amount: number
                    date_released: string
                    deal_id: string
                    id: string
                    is_advanced: boolean | null
                    professional_fee: number | null
                    rate: number | null
                    user_id: string
                    voucher_number: number | null
                }
                Insert: {
                    amount: number
                    date_released: string
                    deal_id: string
                    id?: string
                    is_advanced?: boolean | null
                    professional_fee?: number | null
                    rate?: number | null
                    user_id: string
                    voucher_number?: number | null
                }
                Update: {
                    amount?: number
                    date_released?: string
                    deal_id?: string
                    id?: string
                    is_advanced?: boolean | null
                    professional_fee?: number | null
                    rate?: number | null
                    user_id?: string
                    voucher_number?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'commissions_deal_id_fkey'
                        columns: ['deal_id']
                        isOneToOne: false
                        referencedRelation: 'deals'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'commissions_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            daily_cashflow_reports: {
                Row: {
                    cents: number | null
                    date: string
                    fifties: number | null
                    five_hundreds: number | null
                    fives: number | null
                    in: number | null
                    net: number | null
                    one_hundreds: number | null
                    ones: number | null
                    out: number | null
                    tens: number | null
                    thousands: number | null
                    total_received: number | null
                    twenties: number | null
                    two_hundreds: number | null
                    updated_at: string
                }
                Insert: {
                    cents?: number | null
                    date: string
                    fifties?: number | null
                    five_hundreds?: number | null
                    fives?: number | null
                    in?: number | null
                    net?: number | null
                    one_hundreds?: number | null
                    ones?: number | null
                    out?: number | null
                    tens?: number | null
                    thousands?: number | null
                    total_received?: number | null
                    twenties?: number | null
                    two_hundreds?: number | null
                    updated_at: string
                }
                Update: {
                    cents?: number | null
                    date?: string
                    fifties?: number | null
                    five_hundreds?: number | null
                    fives?: number | null
                    in?: number | null
                    net?: number | null
                    one_hundreds?: number | null
                    ones?: number | null
                    out?: number | null
                    tens?: number | null
                    thousands?: number | null
                    total_received?: number | null
                    twenties?: number | null
                    two_hundreds?: number | null
                    updated_at?: string
                }
                Relationships: []
            }
            deal_files: {
                Row: {
                    deal_id: string
                    document_type: Database['public']['Enums']['deal_file_type_enum'] | null
                    file_url: string | null
                    id: string
                    uploaded_at: string | null
                }
                Insert: {
                    deal_id: string
                    document_type?: Database['public']['Enums']['deal_file_type_enum'] | null
                    file_url?: string | null
                    id?: string
                    uploaded_at?: string | null
                }
                Update: {
                    deal_id?: string
                    document_type?: Database['public']['Enums']['deal_file_type_enum'] | null
                    file_url?: string | null
                    id?: string
                    uploaded_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'deal_files_deal_id_fkey'
                        columns: ['deal_id']
                        isOneToOne: false
                        referencedRelation: 'deals'
                        referencedColumns: ['id']
                    },
                ]
            }
            deal_users: {
                Row: {
                    deal_id: string
                    id: string
                    user_id: string
                }
                Insert: {
                    deal_id: string
                    id?: string
                    user_id: string
                }
                Update: {
                    deal_id?: string
                    id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'deal_users_deal_id_fkey'
                        columns: ['deal_id']
                        isOneToOne: false
                        referencedRelation: 'deals'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'deal_users_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'users'
                        referencedColumns: ['id']
                    },
                ]
            }
            deals: {
                Row: {
                    client_id: string
                    discount: number
                    end_of_contract: string | null
                    id: string
                    monthly_amortization: number | null
                    net_total_contract_price: number | null
                    price_per_square_meter: number | null
                    property_id: string
                    remaining_balance: number | null
                    start_of_contract: string | null
                    status: Database['public']['Enums']['deal_status_enum'] | null
                    terms: number
                    total_contract_price: number | null
                }
                Insert: {
                    client_id: string
                    discount?: number
                    end_of_contract?: string | null
                    id?: string
                    monthly_amortization?: number | null
                    net_total_contract_price?: number | null
                    price_per_square_meter?: number | null
                    property_id: string
                    remaining_balance?: number | null
                    start_of_contract?: string | null
                    status?: Database['public']['Enums']['deal_status_enum'] | null
                    terms: number
                    total_contract_price?: number | null
                }
                Update: {
                    client_id?: string
                    discount?: number
                    end_of_contract?: string | null
                    id?: string
                    monthly_amortization?: number | null
                    net_total_contract_price?: number | null
                    price_per_square_meter?: number | null
                    property_id?: string
                    remaining_balance?: number | null
                    start_of_contract?: string | null
                    status?: Database['public']['Enums']['deal_status_enum'] | null
                    terms?: number
                    total_contract_price?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'deals_client_id_fkey'
                        columns: ['client_id']
                        isOneToOne: false
                        referencedRelation: 'clients'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'deals_property_id_fkey'
                        columns: ['property_id']
                        isOneToOne: false
                        referencedRelation: 'properties'
                        referencedColumns: ['id']
                    },
                ]
            }
            payments: {
                Row: {
                    amount_paid: number
                    date: string
                    deal_id: string
                    delayed_fee: number | null
                    id: string
                    official_receipt_id: string | null
                    particulars: string | null
                    payment_method: Database['public']['Enums']['payment_method_enum'] | null
                    provisional_receipt_id: string | null
                    remarks: string | null
                    type: Database['public']['Enums']['payment_type_enum'] | null
                }
                Insert: {
                    amount_paid: number
                    date: string
                    deal_id: string
                    delayed_fee?: number | null
                    id?: string
                    official_receipt_id?: string | null
                    particulars?: string | null
                    payment_method?: Database['public']['Enums']['payment_method_enum'] | null
                    provisional_receipt_id?: string | null
                    remarks?: string | null
                    type?: Database['public']['Enums']['payment_type_enum'] | null
                }
                Update: {
                    amount_paid?: number
                    date?: string
                    deal_id?: string
                    delayed_fee?: number | null
                    id?: string
                    official_receipt_id?: string | null
                    particulars?: string | null
                    payment_method?: Database['public']['Enums']['payment_method_enum'] | null
                    provisional_receipt_id?: string | null
                    remarks?: string | null
                    type?: Database['public']['Enums']['payment_type_enum'] | null
                }
                Relationships: [
                    {
                        foreignKeyName: 'payments_deal_id_fkey'
                        columns: ['deal_id']
                        isOneToOne: false
                        referencedRelation: 'deals'
                        referencedColumns: ['id']
                    },
                ]
            }
            projects: {
                Row: {
                    id: string
                    location: string | null
                    name: string | null
                }
                Insert: {
                    id?: string
                    location?: string | null
                    name?: string | null
                }
                Update: {
                    id?: string
                    location?: string | null
                    name?: string | null
                }
                Relationships: []
            }
            properties: {
                Row: {
                    block: string
                    id: string
                    lot: string
                    name: string
                    phase: string
                    project_id: string
                    square_meters: number
                    status: Database['public']['Enums']['property_status_enum']
                }
                Insert: {
                    block: string
                    id?: string
                    lot: string
                    name: string
                    phase: string
                    project_id: string
                    square_meters: number
                    status: Database['public']['Enums']['property_status_enum']
                }
                Update: {
                    block?: string
                    id?: string
                    lot?: string
                    name?: string
                    phase?: string
                    project_id?: string
                    square_meters?: number
                    status?: Database['public']['Enums']['property_status_enum']
                }
                Relationships: [
                    {
                        foreignKeyName: 'properties_project_id_fkey'
                        columns: ['project_id']
                        isOneToOne: false
                        referencedRelation: 'projects'
                        referencedColumns: ['id']
                    },
                ]
            }
            users: {
                Row: {
                    address: string | null
                    contact_number: string | null
                    created_at: string
                    email: string
                    id: string
                    last_login_at: string | null
                    name: string | null
                    role: Database['public']['Enums']['user_role_enum']
                    status: Database['public']['Enums']['user_status_enum']
                    updated_at: string
                }
                Insert: {
                    address?: string | null
                    contact_number?: string | null
                    created_at?: string
                    email: string
                    id: string
                    last_login_at?: string | null
                    name?: string | null
                    role?: Database['public']['Enums']['user_role_enum']
                    status?: Database['public']['Enums']['user_status_enum']
                    updated_at?: string
                }
                Update: {
                    address?: string | null
                    contact_number?: string | null
                    created_at?: string
                    email?: string
                    id?: string
                    last_login_at?: string | null
                    name?: string | null
                    role?: Database['public']['Enums']['user_role_enum']
                    status?: Database['public']['Enums']['user_status_enum']
                    updated_at?: string
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
            address_status_enum: 'owned' | 'rented' | 'living_with_relatives'
            civil_status_enum: 'single' | 'married' | 'widowed' | 'divorced' | 'legally_separated'
            client_sex_enum: 'male' | 'female'
            client_status_enum: 'active' | 'disabled' | 'archived'
            deal_file_type_enum:
                | 'proof_of_payment'
                | 'reservation_form'
                | 'contract'
                | 'provisional_receipt'
                | 'official_receipt'
            deal_status_enum: 'pending' | 'active' | 'cancelled' | 'complete' | 'archived'
            employer_status_enum: 'part_time' | 'full_time' | 'contractual'
            payment_method_enum: 'cash' | 'check' | 'card' | 'bank_transfer' | 'e_wallet'
            payment_type_enum: 'down_payment' | 'reservation' | 'collection'
            property_status_enum:
                | 'available'
                | 'reserved'
                | 'under_contract'
                | 'canceled'
                | 'withdrawn'
                | 'sold'
                | 'archived'
            user_role_enum:
                | 'admin'
                | 'sales_manager'
                | 'sales_agent'
                | 'accounting_staff'
                | 'documentation_staff'
                | 'marketing'
            user_status_enum: 'online' | 'offline' | 'disabled' | 'archived'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
          ? R
          : never
      : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I
        }
          ? I
          : never
      : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U
        }
          ? U
          : never
      : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never

export const Constants = {
    public: {
        Enums: {
            address_status_enum: ['owned', 'rented', 'living_with_relatives'],
            civil_status_enum: ['single', 'married', 'widowed', 'divorced', 'legally_separated'],
            client_sex_enum: ['male', 'female'],
            client_status_enum: ['active', 'disabled', 'archived'],
            deal_file_type_enum: [
                'proof_of_payment',
                'reservation_form',
                'contract',
                'provisional_receipt',
                'official_receipt',
            ],
            deal_status_enum: ['pending', 'active', 'cancelled', 'complete', 'archived'],
            employer_status_enum: ['part_time', 'full_time', 'contractual'],
            payment_method_enum: ['cash', 'check', 'card', 'bank_transfer', 'e_wallet'],
            payment_type_enum: ['down_payment', 'reservation', 'collection'],
            property_status_enum: [
                'available',
                'reserved',
                'under_contract',
                'canceled',
                'withdrawn',
                'sold',
                'archived',
            ],
            user_role_enum: [
                'admin',
                'sales_manager',
                'sales_agent',
                'accounting_staff',
                'documentation_staff',
                'marketing',
            ],
            user_status_enum: ['online', 'offline', 'disabled', 'archived'],
        },
    },
} as const
