// src/routes/_auth/requireAuth.ts
import { redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/supabaseClient'

// Generic constraint: any ctx that has a location with an optional href string
export async function requireAuthOrRedirect<T extends { location: { href?: string } }>({
    location,
}: T) {
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        const href = location.href ?? '/'
        throw redirect({ to: '/login', search: { redirect: href } })
    }
}
