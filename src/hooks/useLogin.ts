// src/hooks/useLogin.ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'

export function useLogin() {
    const { navigate } = useRouter()
    const [loading, setLoading] = useState(false)

    // check on mount: if already signed in, go to dashboard
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate({ to: '/' })
        })
    }, [navigate])

    const login = useCallback(
        async (email: string, password: string) => {
            setLoading(true)
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            setLoading(false)

            if (error) {
                toast.error('Login failed: ' + error.message)
            } else {
                toast.success('Logged in!')
                navigate({ to: '/' })
            }
        },
        [navigate]
    )

    return { login, loading }
}
