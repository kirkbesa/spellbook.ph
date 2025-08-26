import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type PublicBinder = {
    id: string
    owner_id: string
    name: string
    description: string | null
    color_hex: string | null
    pocket_layout: number | null
    image_url: string | null
    privacy: 'public' | 'unlisted' | 'private'
    created_at: string
    updated_at: string
    card_count: number
}

export function useUserPublicBinders(userId?: string) {
    const [binders, setBinders] = React.useState<PublicBinder[]>([])
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        let cancelled = false
        const run = async () => {
            if (!userId) return
            setLoading(true)
            setError(null)

            const { data: session } = await supabase.auth.getSession()
            const token = session.session?.access_token ?? null

            try {
                const res = await fetch(`${API_BASE}/api/binders/by-user/${userId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                })
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}))
                    throw new Error(body?.error || `Failed (${res.status})`)
                }
                const { data } = await res.json()
                if (!cancelled) setBinders(data ?? [])
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load binders')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        run()
        return () => {
            cancelled = true
        }
    }, [userId])

    return { binders, loading, error }
}
