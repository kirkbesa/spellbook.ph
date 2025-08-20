import { userClientFromToken } from '../lib/supabase/supabaseAdminClient.js'

export async function attachSupabase(req, _res, next) {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    req.token = token
    req.supabase = userClientFromToken(token)
    if (token) {
        const { data, error } = await req.supabase.auth.getUser()
        if (!error) req.user = data.user
    }
    next()
}

export function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' })
    next()
}
