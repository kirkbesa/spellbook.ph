import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function useRemoveBinderCard(onRemoved?: (id: string) => void) {
    const [removingId, setRemovingId] = React.useState<string | null>(null)

    const remove = React.useCallback(
        async (id: string) => {
            setRemovingId(id)
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                if (!token) throw new Error('Not authenticated')

                const r = await fetch(`${API_BASE}/api/binder-cards/${id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                })
                const body = await r.json().catch(() => ({}))
                if (!r.ok) throw new Error(body?.error || 'Failed to remove card')

                onRemoved?.(id)
                return true
            } finally {
                setRemovingId(null)
            }
        },
        [onRemoved]
    )

    return { remove, removingId }
}
