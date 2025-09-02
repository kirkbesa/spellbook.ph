// src/hooks/chat/useStartConversation.ts
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

export async function startConversationByUsername(username: string) {
    const headers = await authHeaders()
    const res = await fetch(`${API_BASE}/api/conversations/start-by-username`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ username }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.error || res.statusText)
    return json.id as string
}
