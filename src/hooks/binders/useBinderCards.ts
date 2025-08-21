// src/hooks/binders/useBinderCards.ts
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import type { BinderCard } from './cardTypes'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function useBinderCards(binderId: string) {
    const [cards, setCards] = React.useState<BinderCard[]>([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    const fetchCards = React.useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: session } = await supabase.auth.getSession()
            const token = session.session?.access_token ?? null

            const res = await fetch(`${API_BASE}/api/binders/${binderId}/cards`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error || `Failed to fetch cards (${res.status})`)
            }
            const { data } = (await res.json()) as { data: BinderCard[] }
            setCards(data ?? [])
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load binder cards')
        } finally {
            setLoading(false)
        }
    }, [binderId])

    React.useEffect(() => {
        fetchCards()
    }, [fetchCards])

    return { cards, loading, error, refresh: fetchCards, setCards }
}
