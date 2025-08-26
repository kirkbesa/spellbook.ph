// src/hooks/chat/markRead.ts
import { supabase } from '@/lib/supabase/supabaseClient'

export async function markConversationRead({
    conversationId,
    myUserId,
    latestMessageId,
}: {
    conversationId: string
    myUserId: string
    latestMessageId?: number
}) {
    if (!conversationId || !myUserId) return

    let latestId = latestMessageId
    if (!latestId) {
        const { data } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conversationId)
            .order('id', { ascending: false })
            .limit(1)
            .maybeSingle()
        if (data?.id) latestId = data.id as number
    }

    await supabase
        .from('conversation_participants')
        .update({
            last_read_message_id: latestId ?? null,
            last_read_at: new Date().toISOString(),
        })
        .eq('conversation_id', conversationId)
        .eq('user_id', myUserId)

    await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', myUserId)
        .eq('type', 'message')
        .eq('conversation_id', conversationId)
        .is('read_at', null)
}
