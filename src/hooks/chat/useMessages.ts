// src/hooks/chat/useMessages.ts
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type ChatMessage = {
    id: number
    conversation_id: string
    sender_id: string
    content: string | null
    created_at: string
}

async function authHeaders() {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export function useMessages(conversationId: string | null) {
    const [messages, setMessages] = React.useState<ChatMessage[]>([])
    const [loading, setLoading] = React.useState(false)

    const fetchMessages = React.useCallback(async () => {
        if (!conversationId) return
        setLoading(true)
        try {
            const headers = await authHeaders()
            const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages`, {
                headers,
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || res.statusText)
            setMessages(json?.data ?? [])
        } finally {
            setLoading(false)
        }
    }, [conversationId])

    React.useEffect(() => {
        fetchMessages()
    }, [fetchMessages])

    React.useEffect(() => {
        if (!conversationId) return
        const channel = supabase
            .channel(`conv-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as ChatMessage])
                }
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [conversationId])

    const send = React.useCallback(
        async (content: string) => {
            if (!conversationId) return
            const headers = await authHeaders()
            const res = await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ content }),
            })
            const json = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(json?.error || res.statusText)
            // realtime will append on INSERT
        },
        [conversationId]
    )

    return { messages, loading, send, refresh: fetchMessages }
}
