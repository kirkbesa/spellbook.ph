// src/lib/supabaseAdminClient.js

// 1) load .env in dev
import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// 2) validate
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[supabaseAdminClient] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

// 3) create the privileged client
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
