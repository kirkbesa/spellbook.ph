// src/hooks/notifications/useUnreadMessageCount.ts
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

export function useUnreadMessageCount(userId?: string) {
    const [count, setCount] = React.useState(0)
    const [loading, setLoading] = React.useState(false)

    const fetchCount = React.useCallback(async () => {
        if (!userId) {
            setCount(0)
            return
        }
        setLoading(true)
        const { count: c, error } = await supabase
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('type', 'message')
            .is('read_at', null)
        if (!error && typeof c === 'number') setCount(c)
        setLoading(false)
    }, [userId])

    React.useEffect(() => {
        fetchCount()
    }, [fetchCount])

    React.useEffect(() => {
        if (!userId) return
        const channel = supabase
            .channel(`notif-msg-unread:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                () => fetchCount()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userId, fetchCount])

    return { count, loading, refresh: fetchCount }
}
