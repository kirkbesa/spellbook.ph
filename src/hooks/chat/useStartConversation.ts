// src/hooks/chat/useStartConversation.ts
import { supabase } from '@/lib/supabase/supabaseClient'

export async function startConversationByUsername(username: string) {
    const { data: auth } = await supabase.auth.getUser()
    const me = auth.user?.id
    if (!me) throw new Error('Not authenticated')

    // find target user by username (case-insensitive)
    const { data: peer, error: e1 } = await supabase
        .from('users')
        .select('id, username')
        .ilike('username', username)
        .limit(1)
        .maybeSingle()

    if (e1) throw e1
    if (!peer) throw new Error('User not found')
    if (peer.id === me) throw new Error('Cannot chat with yourself')

    const { data: convId, error: e2 } = await supabase.rpc('create_conversation_with', {
        peer: peer.id,
    })

    if (e2) throw e2
    return convId as string
}
