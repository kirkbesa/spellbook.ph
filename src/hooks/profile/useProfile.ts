// src/hooks/profile/useProfile.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import type { Row, Update } from '@/types/types'

type Profile = Row<'users'>
type ProfilePatch = Partial<Update<'users'>> // safe partial for PATCH

// Change if your API isn’t proxied. e.g. 'http://localhost:3000'
const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [updating, setUpdating] = useState(false)

    const tokenRef = useRef<string | null>(null)
    const userIdRef = useRef<string | null>(null)
    const isMounted = useRef(true)

    // Grab session token & user id once (and on auth changes)
    useEffect(() => {
        isMounted.current = true
        const loadAuth = async () => {
            const [{ data: userData }, { data: sessionData }] = await Promise.all([
                supabase.auth.getUser(),
                supabase.auth.getSession(),
            ])
            userIdRef.current = userData.user?.id ?? null
            tokenRef.current = sessionData.session?.access_token ?? null
        }
        loadAuth()

        const { data: sub } = supabase.auth.onAuthStateChange(async () => {
            await loadAuth()
            // if auth changed, refresh profile
            await refresh()
        })

        return () => {
            isMounted.current = false
            sub.subscription.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const authHeader = useMemo(
        () =>
            tokenRef.current
                ? { Authorization: `Bearer ${tokenRef.current}` }
                : ({} as Record<string, string>),
        [tokenRef.current]
    )

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const uid = userIdRef.current
            if (!uid) {
                if (isMounted.current) {
                    setProfile(null)
                    setLoading(false)
                }
                return
            }

            const res = await fetch(`${API_BASE}/api/users/${uid}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...authHeader,
                },
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error || `Failed to load profile (${res.status})`)
            }
            const { data } = (await res.json()) as { data: Profile }
            if (isMounted.current) {
                setProfile(data)
            }
        } catch (e) {
            if (isMounted.current)
                setError(e instanceof Error ? e.message : 'Failed to load profile')
        } finally {
            if (isMounted.current) setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authHeader])

    useEffect(() => {
        // initial fetch
        refresh()
    }, [refresh])

    const updateProfile = useCallback(
        async (patch: ProfilePatch) => {
            setUpdating(true)
            setError(null)
            try {
                const uid = userIdRef.current
                if (!uid) throw new Error('Not authenticated')

                const res = await fetch(`${API_BASE}/api/users/${uid}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeader,
                    },
                    body: JSON.stringify(patch),
                })
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}))
                    throw new Error(body?.error || `Failed to update profile (${res.status})`)
                }
                const { data } = (await res.json()) as { data: Profile }
                if (isMounted.current) setProfile(data)
                return data
            } catch (e) {
                if (isMounted.current)
                    setError(e instanceof Error ? e.message : 'Failed to update profile')
                throw e
            } finally {
                if (isMounted.current) setUpdating(false)
            }
        },
        [authHeader]
    )

    return {
        profile,
        loading,
        error,
        updating,
        refresh,
        updateProfile,
        setProfile, // exposed for optimistic UI if you want
    }
}
