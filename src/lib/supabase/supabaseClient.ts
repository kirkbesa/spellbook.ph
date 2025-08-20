// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
            'Put them in your frontend .env(.development) and restart Vite.'
    )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
