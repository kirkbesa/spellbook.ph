// src/hooks/cards/useCardSearch.ts
import * as React from 'react'
type DbCard = {
    scryfall_id: string
    oracle_id: string | null
    name: string
    set_code: string
    collector_number: string
    image_small: string | null
    image_normal: string | null
    tcgplayer_product_id: number | null
}
export type SearchResult = { source: 'db' | 'scryfall'; card: DbCard }

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function useCardSearch() {
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<SearchResult[]>([])
    const search = React.useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([])
            return
        }
        setLoading(true)
        try {
            const r = await fetch(`${API_BASE}/api/cards/search?q=${encodeURIComponent(q)}`)
            const j = await r.json()
            const merged: SearchResult[] = [
                ...(j.db ?? []).map((c: DbCard) => ({ source: 'db' as const, card: c })),
                ...(j.scryfall ?? []).map((c: DbCard) => ({
                    source: 'scryfall' as const,
                    card: c,
                })),
            ]
            setResults(merged)
        } catch {
            setResults([])
        } finally {
            setLoading(false)
        }
    }, [])
    return { loading, results, search, setResults }
}
