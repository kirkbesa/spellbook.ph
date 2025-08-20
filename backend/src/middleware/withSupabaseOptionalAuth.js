import { anon, userClientFromToken } from '../lib/supabase/supabaseAdminClient.js'

export function withSupabaseOptionalAuth(req, _res, next) {
    const auth = req.headers.authorization
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
    req.supabase = token ? userClientFromToken(token) : anon
    next()
}
