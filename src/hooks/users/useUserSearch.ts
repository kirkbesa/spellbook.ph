// src/hooks/users/useUserSearch.ts
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

export type UserSuggestion = {
    id: string
    username: string | null
    image_url: string | null
}

export function useUserSearch(excludeUserId?: string) {
    const [results, setResults] = React.useState<UserSuggestion[]>([])
    const [loading, setLoading] = React.useState(false)

    const search = React.useCallback(
        async (q: string) => {
            const term = q.trim()
            if (!term) {
                setResults([])
                return
            }
            setLoading(true)
            const { data, error } = await supabase
                .from('users')
                .select('id, username, image_url')
                .not('username', 'is', null)
                .ilike('username', `%${term}%`)
                .limit(8)
            if (!error) {
                setResults((data ?? []).filter((u) => u.id !== excludeUserId))
            }
            setLoading(false)
        },
        [excludeUserId]
    )

    return { results, loading, search, setResults }
}
