// src/hooks/chat/markRead.ts
import { supabase } from '@/lib/supabase/supabaseClient'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

async function authHeaders() {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
}

export async function markConversationRead({
    conversationId,
    latestMessageId,
}: {
    conversationId: string
    latestMessageId?: number
}) {
    if (!conversationId) return
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ latestMessageId }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || res.statusText)
}
