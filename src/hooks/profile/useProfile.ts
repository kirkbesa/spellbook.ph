// src/hooks/profile/useProfile.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import type { Row, Update } from '@/types/types'

type Profile = Row<'users'>
type ProfilePatch = Partial<Update<'users'>>

const API_BASE = import.meta.env.VITE_API_BASE ?? '' // e.g. 'http://localhost:3000'

export function useProfile() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [updating, setUpdating] = useState(false)

    // Auth state we care about for API calls
    const [uid, setUid] = useState<string | null>(null)
    const [token, setToken] = useState<string | null>(null)

    // Keep auth in sync (initial + changes)
    useEffect(() => {
        const sync = async () => {
            const [{ data: u }, { data: s }] = await Promise.all([
                supabase.auth.getUser(),
                supabase.auth.getSession(),
            ])
            setUid(u.user?.id ?? null)
            setToken(s.session?.access_token ?? null)
        }
        sync()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUid(session?.user?.id ?? null)
            setToken(session?.access_token ?? null)
        })
        return () => subscription.unsubscribe()
    }, [])

    const authHeader = useMemo(
        () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
        [token]
    )

    const refresh = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            if (!uid) {
                setProfile(null)
                return
            }
            const res = await fetch(`${API_BASE}/api/users/${uid}`, {
                headers: { 'Content-Type': 'application/json', ...authHeader },
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error || `Failed to load profile (${res.status})`)
            }
            const { data } = (await res.json()) as { data: Profile }
            setProfile(data)
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load profile')
        } finally {
            setLoading(false)
        }
    }, [API_BASE, uid, authHeader])

    useEffect(() => {
        // fetch whenever uid/token changes (e.g., after confirmation)
        refresh()
    }, [refresh])

    const updateProfile = useCallback(
        async (patch: ProfilePatch) => {
            setUpdating(true)
            setError(null)
            try {
                if (!uid) throw new Error('Not authenticated')
                const res = await fetch(`${API_BASE}/api/users/${uid}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', ...authHeader },
                    body: JSON.stringify(patch),
                })
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}))
                    throw new Error(body?.error || `Failed to update profile (${res.status})`)
                }
                const { data } = (await res.json()) as { data: Profile }
                setProfile(data)
                return data
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to update profile')
                throw e
            } finally {
                setUpdating(false)
            }
        },
        [API_BASE, uid, authHeader]
    )

    return { profile, loading, error, updating, refresh, updateProfile, setProfile }
}
