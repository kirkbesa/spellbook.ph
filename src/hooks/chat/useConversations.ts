// src/hooks/chat/useConversation.ts
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type ConversationListItem = {
    id: string
    last_message_at: string | null
    last_message_id: number | null
    participants: Array<{ user_id: string; username: string | null; image_url: string | null }>
    last_message_preview?: string | null
}

async function authHeaders() {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export function useConversations(myUserId: string | undefined) {
    const [convs, setConvs] = React.useState<ConversationListItem[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchConvs = React.useCallback(async () => {
        setLoading(true)
        try {
            const headers = await authHeaders()
            const res = await fetch(`${API_BASE}/api/conversations/mine`, { headers })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || res.statusText)
            setConvs(json?.data ?? [])
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        fetchConvs()
    }, [fetchConvs])

    React.useEffect(() => {
        const channel = supabase
            .channel('conv-list')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                fetchConvs
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                fetchConvs
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [fetchConvs])

    const peerOf = React.useCallback(
        (c: ConversationListItem) => c.participants.find((p) => p.user_id !== myUserId),
        [myUserId]
    )

    return { convs, loading, refresh: fetchConvs, peerOf }
}
