// src/hooks/binders/useCreateBinder.ts
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import type { Row } from '@/types/types'

export type Binder = Row<'binders'>
export type PocketLayout = 4 | 9 | 16
export type BinderPrivacy = 'public' | 'unlisted' | 'private'

export type CreateBinderInput = {
    name: string
    pocket_layout: PocketLayout
    privacy: BinderPrivacy
    color_hex?: string | null
    image_url?: string | null
    description?: string | null
}

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function useCreateBinder() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const createBinder = useCallback(async (input: CreateBinderInput) => {
        setLoading(true)
        setError(null)
        try {
            const [{ data: userData }, { data: sessionData }] = await Promise.all([
                supabase.auth.getUser(),
                supabase.auth.getSession(),
            ])
            const uid = userData.user?.id
            const token = sessionData.session?.access_token
            if (!uid || !token) throw new Error('Not authenticated')

            // RLS requires owner_id = auth.uid(); pass it from frontend (safe).
            const res = await fetch(`${API_BASE}/api/binders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...input,
                    owner_id: uid,
                }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error || `Failed to create binder (${res.status})`)
            }

            const { data } = (await res.json()) as { data: Binder }
            return data
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to create binder'
            setError(msg)
            throw e
        } finally {
            setLoading(false)
        }
    }, [])

    return { createBinder, loading, error }
}
