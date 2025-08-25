// src/hooks/users/usePublicUser.ts
import { useEffect, useState } from 'react'
import type { Row } from '@/types/types'

export type PublicUser = Pick<
    Row<'users'>,
    'id' | 'username' | 'first_name' | 'last_name' | 'location' | 'image_url' | 'isverified'
>

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function usePublicUser(userId?: string | null) {
    const [user, setUser] = useState<PublicUser | null>(null)
    const [loading, setLoading] = useState<boolean>(!!userId)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) {
            setUser(null)
            setLoading(false)
            return
        }

        let cancelled = false
        setLoading(true)
        setError(null)
        ;(async () => {
            try {
                const res = await fetch(`${API_BASE}/api/users/public/${userId}`, {
                    headers: { 'Content-Type': 'application/json' },
                })
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}))
                    throw new Error(body?.error || `Failed to load user (${res.status})`)
                }
                const { data } = (await res.json()) as { data: PublicUser }
                if (!cancelled) setUser(data)
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load user')
            } finally {
                if (!cancelled) setLoading(false)
            }
        })()

        return () => {
            cancelled = true
        }
    }, [userId])

    return { user, loading, error }
}
