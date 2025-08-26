import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

export type ChatMessage = {
    id: number
    conversation_id: string
    sender_id: string
    content: string | null
    created_at: string
}

export function useMessages(conversationId: string | null) {
    const [messages, setMessages] = React.useState<ChatMessage[]>([])
    const [loading, setLoading] = React.useState(false)

    const fetchMessages = React.useCallback(async () => {
        if (!conversationId) return
        setLoading(true)
        const { data, error } = await supabase
            .from('messages')
            .select('id, conversation_id, sender_id, content, created_at')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
        if (error) throw error
        setMessages(data ?? [])
        setLoading(false)
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
            const {
                data: { user },
            } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')
            const { error } = await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content,
            })
            if (error) throw error
        },
        [conversationId]
    )

    return { messages, loading, send, refresh: fetchMessages }
}
