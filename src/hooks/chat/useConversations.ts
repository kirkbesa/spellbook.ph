import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

export type ConversationListItem = {
    id: string
    last_message_at: string | null
    last_message_id: number | null
    participants: Array<{ user_id: string; username: string | null; image_url: string | null }>
    last_message_preview?: string | null
}

export function useConversations(myUserId: string | undefined) {
    const [convs, setConvs] = React.useState<ConversationListItem[]>([])
    const [loading, setLoading] = React.useState(true)

    const fetchConvs = React.useCallback(async () => {
        setLoading(true)
        // get conversations + nested participants + preview (optional extra query)
        const { data, error } = await supabase
            .from('conversations')
            .select(
                `
        id,
        last_message_at,
        last_message_id,
        conversation_participants (
          user_id,
          users: user_id ( username, image_url )
        )
      `
            )
            .order('last_message_at', { ascending: false })
        if (error) throw error

        const items: ConversationListItem[] = (data ?? []).map((c) => ({
            id: c.id,
            last_message_at: c.last_message_at,
            last_message_id: c.last_message_id,
            participants: (c.conversation_participants ?? []).map((p) => {
                const u = Array.isArray(p.users) ? p.users[0] : p.users
                return {
                    user_id: p.user_id,
                    username: u?.username ?? null,
                    image_url: u?.image_url ?? null,
                }
            }),
        }))

        setConvs(items)
        setLoading(false)
    }, [])

    React.useEffect(() => {
        fetchConvs()
    }, [fetchConvs])

    // Realtime: refresh list when conversations bump or new messages arrive
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

    // helpers
    const peerOf = React.useCallback(
        (c: ConversationListItem) => c.participants.find((p) => p.user_id !== myUserId),
        [myUserId]
    )

    return { convs, loading, refresh: fetchConvs, peerOf }
}
