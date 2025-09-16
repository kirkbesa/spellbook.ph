// src/hooks/auth/useUsernameAvailability.ts
import { useEffect, useMemo, useState } from 'react'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/
const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function useUsernameAvailability(username: string) {
    const value = username.trim()
    const valid = USERNAME_RE.test(value)
    const [checking, setChecking] = useState(false)
    const [available, setAvailable] = useState<boolean | null>(null)
    const [error, setError] = useState<string | null>(null)

    // Debounce the check
    useEffect(() => {
        setError(null)
        if (!value || !valid) {
            setAvailable(null)
            return
        }
        setChecking(true)
        const ctl = new AbortController()
        const t = setTimeout(async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/api/users/check-username?u=${encodeURIComponent(value)}`,
                    { headers: { Accept: 'application/json' }, signal: ctl.signal }
                )
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const json = (await res.json()) as { available: boolean }
                setAvailable(!!json.available)
            } catch {
                // treat as unknown; final submit still handles conflicts
                setAvailable(null)
                setError(null)
            } finally {
                setChecking(false)
            }
        }, 400)

        return () => {
            clearTimeout(t)
            ctl.abort()
        }
    }, [value, valid])

    return useMemo(
        () => ({ value, valid, checking, available, error }),
        [value, valid, checking, available, error]
    )
}
