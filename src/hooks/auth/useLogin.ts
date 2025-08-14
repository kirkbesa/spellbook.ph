// src/hooks/auth/useLogin.ts
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

export function useLogin() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const login = useCallback(
        async (email: string, password: string) => {
            if (loading) return { ok: false as const, error: 'Already logging in' }
            setLoading(true)
            setError(null)

            try {
                if (!email || !password) throw new Error('Please enter email and password.')

                const { error: sbError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (sbError) {
                    const msg = /email.*confirm/i.test(sbError.message)
                        ? 'Email not confirmed'
                        : sbError.message || 'Login failed.'
                    setError(msg)
                    return { ok: false as const, error: msg }
                }

                return { ok: true as const }
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Something went wrong logging in.'
                setError(msg)
                return { ok: false as const, error: msg }
            } finally {
                setLoading(false)
            }
        },
        [loading]
    )

    return { login, loading, error, setError }
}
