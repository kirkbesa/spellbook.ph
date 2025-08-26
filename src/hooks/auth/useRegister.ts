// src/hooks/auth/useRegister.ts
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'

type RegisterOptions = {
    emailRedirectTo?: string
    username?: string
}

type RegisterResult = { ok: true; needsEmailConfirmation: boolean } | { ok: false; error: string }

export function useRegister() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const register = useCallback(
        async (
            email: string,
            password: string,
            opts: RegisterOptions = {}
        ): Promise<RegisterResult> => {
            if (loading) return { ok: false, error: 'Already signing up' }
            setLoading(true)
            setError(null)

            try {
                if (!email || !password) throw new Error('Please fill in all fields.')

                // Provide a reliable redirect (must be allowlisted in Supabase Auth settings)
                const emailRedirectTo =
                    opts.emailRedirectTo || `${window.location.origin}/auth/callback`

                const { data, error: signUpErr } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo,
                        ...(opts.username?.trim()
                            ? { data: { username: opts.username.trim() } }
                            : {}),
                    },
                })

                if (signUpErr) {
                    const msg = signUpErr.message || 'Sign up failed.'
                    setError(msg)
                    return { ok: false, error: msg }
                }

                // Some misconfigurations can return no user — treat this as an error so the UI doesn’t show success.
                if (!data?.user) {
                    const msg =
                        'Sign up succeeded but no user was returned. Check your SUPABASE_URL / anon key and Auth settings.'
                    setError(msg)
                    return { ok: false, error: msg }
                }

                // If email confirmations are enabled, session will be null and user must verify via email
                const needsEmailConfirmation = !data.session
                return { ok: true, needsEmailConfirmation }
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Something went wrong signing up.'
                setError(msg)
                return { ok: false, error: msg }
            } finally {
                setLoading(false)
            }
        },
        [loading]
    )

    return { register, loading, error, setError }
}
