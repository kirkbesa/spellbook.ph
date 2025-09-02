// src/hooks/chat/useConversationParticipants.ts
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type ConvParticipant = {
    conversation_id: string
    user_id: string
    last_read_message_id: number | null
    last_read_at: string | null
    users: { username: string | null; image_url: string | null } | null
}

async function authHeaders() {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export function useConversationParticipants(conversationId?: string | null) {
    const [parts, setParts] = React.useState<ConvParticipant[]>([])
    const [loading, setLoading] = React.useState(false)

    const fetchOnce = React.useCallback(async () => {
        if (!conversationId) {
            setParts([])
            return
        }
        setLoading(true)
        try {
            const headers = await authHeaders()
            const res = await fetch(
                `${API_BASE}/api/conversations/${conversationId}/participants`,
                {
                    headers,
                }
            )
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || res.statusText)
            setParts(json?.data ?? [])
        } finally {
            setLoading(false)
        }
    }, [conversationId])

    React.useEffect(() => {
        fetchOnce()
    }, [fetchOnce])

    React.useEffect(() => {
        if (!conversationId) return
        const channel = supabase
            .channel(`conv_parts:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'conversation_participants',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                fetchOnce
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId, fetchOnce])

    return { participants: parts, loading }
}
