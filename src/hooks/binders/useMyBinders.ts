// src/hooks/binders/useMyBinders.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import type { Row } from '@/types/types'

export type Binder = Row<'binders'>
export type BinderWithCount = Binder & { card_count: number }

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function useMyBinders() {
    const [binders, setBinders] = useState<BinderWithCount[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        const run = async () => {
            setLoading(true)
            setError(null)
            try {
                const [{ data: session }, { data: user }] = await Promise.all([
                    supabase.auth.getSession(),
                    supabase.auth.getUser(),
                ])
                const token = session.session?.access_token
                const uid = user.user?.id
                if (!token || !uid) {
                    setBinders([])
                    setLoading(false)
                    return
                }
                const res = await fetch(`${API_BASE}/api/binders/mine`, {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}))
                    throw new Error(body?.error || `Failed to load binders (${res.status})`)
                }
                const { data } = (await res.json()) as { data: BinderWithCount[] }
                if (!cancelled) setBinders(data)
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
    }, [])

    return { binders, loading, error }
}
