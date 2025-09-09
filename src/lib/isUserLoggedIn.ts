// src/utils/auth.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Returns true if the user is logged in, false otherwise
 */
export async function isUserLoggedIn(): Promise<boolean> {
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession()

    if (error) {
        return false
    }

    return !!session
}
