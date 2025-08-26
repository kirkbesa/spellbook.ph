// src/hooks/chat/useConversationParticipants.ts
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

export type ConvParticipant = {
    conversation_id: string
    user_id: string
    last_read_message_id: number | null
    last_read_at: string | null
    users: { username: string | null; image_url: string | null } | null
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
        const { data, error } = await supabase
            .from('conversation_participants')
            .select(
                `
        conversation_id,
        user_id,
        last_read_message_id,
        last_read_at,
        users:users!conversation_participants_user_id_fkey(
          username, image_url
        )
      `
            )
            .eq('conversation_id', conversationId)
            .returns<ConvParticipant[]>()

        setLoading(false)
        if (error) {
            // optional: console.error('[useConversationParticipants]', error)
            return
        }
        setParts(data ?? [])
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
