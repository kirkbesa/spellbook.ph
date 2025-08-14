/*
  Generated TypeScript entity/type aliases based on Supabase-generated Database types.
*/
import { type Database } from './database.types'

// --- Table Entities ---
export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type ClientUpdate = Database['public']['Tables']['clients']['Update']

export type Commission = Database['public']['Tables']['commissions']['Row']
export type CommissionInsert = Database['public']['Tables']['commissions']['Insert']
export type CommissionUpdate = Database['public']['Tables']['commissions']['Update']

export type DailyCashflowReport = Database['public']['Tables']['daily_cashflow_reports']['Row']
export type DailyCashflowReportInsert =
    Database['public']['Tables']['daily_cashflow_reports']['Insert']
export type DailyCashflowReportUpdate =
    Database['public']['Tables']['daily_cashflow_reports']['Update']

export type DealFile = Database['public']['Tables']['deal_files']['Row']
export type DealFileInsert = Database['public']['Tables']['deal_files']['Insert']
export type DealFileUpdate = Database['public']['Tables']['deal_files']['Update']

export type DealUser = Database['public']['Tables']['deal_users']['Row']
export type DealUserInsert = Database['public']['Tables']['deal_users']['Insert']
export type DealUserUpdate = Database['public']['Tables']['deal_users']['Update']

export type Deal = Database['public']['Tables']['deals']['Row']
export type DealInsert = Database['public']['Tables']['deals']['Insert']
export type DealUpdate = Database['public']['Tables']['deals']['Update']

export type Payment = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
export type PaymentUpdate = Database['public']['Tables']['payments']['Update']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type Property = Database['public']['Tables']['properties']['Row']
export type PropertyInsert = Database['public']['Tables']['properties']['Insert']
export type PropertyUpdate = Database['public']['Tables']['properties']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

// --- Enums ---
export type AddressStatus = Database['public']['Enums']['address_status_enum']
export type CivilStatus = Database['public']['Enums']['civil_status_enum']
export type ClientSex = Database['public']['Enums']['client_sex_enum']
export type ClientStatus = Database['public']['Enums']['client_status_enum']
export type DealFileType = Database['public']['Enums']['deal_file_type_enum']
export type DealStatus = Database['public']['Enums']['deal_status_enum']
export type EmployerStatus = Database['public']['Enums']['employer_status_enum']
export type PaymentMethod = Database['public']['Enums']['payment_method_enum']
export type PaymentType = Database['public']['Enums']['payment_type_enum']
export type PropertyStatus = Database['public']['Enums']['property_status_enum']
export type UserRole = Database['public']['Enums']['user_role_enum']
export type UserStatus = Database['public']['Enums']['user_status_enum']

// Optionally, you can group all entity types in a single map:
export type Entities = {
    clients: Client
    commissions: Commission
    daily_cashflow_reports: DailyCashflowReport
    deal_files: DealFile
    deal_users: DealUser
    deals: Deal
    payments: Payment
    projects: Project
    properties: Property
    users: User
}

// And similarly for inserts/updates if needed:
export type Inserts = {
    clients: ClientInsert
    commissions: CommissionInsert
    daily_cashflow_reports: DailyCashflowReportInsert
    deal_files: DealFileInsert
    deal_users: DealUserInsert
    deals: DealInsert
    payments: PaymentInsert
    projects: ProjectInsert
    properties: PropertyInsert
    users: UserInsert
}

export type Updates = {
    clients: ClientUpdate
    commissions: CommissionUpdate
    daily_cashflow_reports: DailyCashflowReportUpdate
    deal_files: DealFileUpdate
    deal_users: DealUserUpdate
    deals: DealUpdate
    payments: PaymentUpdate
    projects: ProjectUpdate
    properties: PropertyUpdate
    users: UserUpdate
}
