import { supabase } from '@/lib/supabase/supabaseClient'
import { useState } from 'react'

interface BulkAddResult {
    success: string[]
    notFound: string[]
}

type BulkAddCard = {
    name: string
    qty: number
}

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function useBulkAddCards(binderId: string) {
    const [results, setResults] = useState<BulkAddResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const addCards = async (cards: BulkAddCard[]) => {
        setLoading(true)
        setError(null)
        try {
            const { data: session } = await supabase.auth.getSession()
            const token = session.session?.access_token
            if (!token) throw new Error('Not authenticated')

            const res = await fetch(`${API_BASE}/api/binders/${binderId}/bulk-add`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ cards: cards }),
            })

            if (!res.ok) {
                const errText = await res.text()
                throw new Error(errText || 'Failed to bulk add cards')
            }

            const data: BulkAddResult = await res.json()
            setResults(data)
            return data
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong')
            throw err
        } finally {
            setLoading(false)
        }
    }

    return { addCards, results, loading, error }
}
