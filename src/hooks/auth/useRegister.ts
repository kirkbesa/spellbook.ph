// src/hooks/auth/useRegister.ts
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

type RegisterOptions = {
    emailRedirectTo?: string
    username?: string
}

export function useRegister() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const register = useCallback(
        async (email: string, password: string, opts: RegisterOptions = {}) => {
            if (loading) return { ok: false, error: 'Already signing up' as const }
            setLoading(true)
            setError(null)

            try {
                if (!email || !password) throw new Error('Please fill in all fields.')

                const options: NonNullable<Parameters<typeof supabase.auth.signUp>[0]['options']> =
                    {
                        emailRedirectTo: opts.emailRedirectTo,
                        ...(opts.username?.trim()
                            ? { data: { username: opts.username.trim() } }
                            : {}),
                    }

                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options,
                })

                if (error) {
                    const msg = error.message || 'Sign up failed.'
                    setError(msg)
                    return { ok: false as const, error: msg }
                }

                // If email confirmations are on, user must click the email link to get a session.
                return { ok: true as const }
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Something went wrong signing up.'
                setError(msg)
                return { ok: false as const, error: msg }
            } finally {
                setLoading(false)
            }
        },
        [loading]
    )

    return { register, loading, error, setError }
}
