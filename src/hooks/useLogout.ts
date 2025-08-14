// src/hooks/useLogout.ts
import { useCallback } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useRouter } from '@tanstack/react-router'

export function useLogout() {
    const { navigate } = useRouter()

    return useCallback(async () => {
        const { error } = await supabase.auth.signOut()
        if (error) {
            console.error('Logout error:', error.message)
            return
        }
        navigate({ to: '/login' })
    }, [navigate])
}
