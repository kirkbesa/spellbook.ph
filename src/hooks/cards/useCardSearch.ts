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

// normalize base (no trailing slash)
const RAW_BASE = import.meta.env.VITE_API_BASE ?? ''
const API_BASE = RAW_BASE.replace(/\/+$/, '')

export function useCardSearch() {
    const [loading, setLoading] = React.useState(false)
    const [results, setResults] = React.useState<SearchResult[]>([])

    // abort previous in-flight request when a new search starts
    const abortRef = React.useRef<AbortController | null>(null)
    const lastQ = React.useRef<string>('')

    const search = React.useCallback(async (q: string) => {
        const query = q.trim()
        lastQ.current = query

        if (query.length < 2) {
            // small guard prevents noisy calls & "no results" flash
            setResults([])
            return
        }

        // cancel previous
        abortRef.current?.abort()
        const ctrl = new AbortController()
        abortRef.current = ctrl

        setLoading(true)
        try {
            const r = await fetch(`${API_BASE}/api/cards/search?q=${encodeURIComponent(query)}`, {
                signal: ctrl.signal,
            })
            if (!r.ok) throw new Error(`Search failed (${r.status})`)
            const j = await r.json()

            // If user kept typing and this response is stale, ignore it
            if (j?.query && j.query !== lastQ.current) return

            let merged: SearchResult[] = []

            if (Array.isArray(j?.prints)) {
                // NEW SHAPE: { query, prints: DbCard[] }
                merged = (j.prints as DbCard[]).map((c) => ({
                    source: 'db', // we can call them db (they're now in your DB after warm)
                    card: normalizeCard(c),
                }))
            } else {
                // OLD SHAPE: { db: DbCard[], scryfall: DbCard[] }
                const fromDb: SearchResult[] = (j?.db ?? []).map((c: DbCard) => ({
                    source: 'db',
                    card: normalizeCard(c),
                }))
                const fromScry: SearchResult[] = (j?.scryfall ?? []).map((c: DbCard) => ({
                    source: 'scryfall',
                    card: normalizeCard(c),
                }))
                merged = [...fromDb, ...fromScry]
            }

            // still relevant?
            if (query !== lastQ.current) return
            setResults(merged)
        } catch (e) {
            if ((e as Error)?.name !== 'AbortError') {
                console.error('useCardSearch error:', e)
                setResults([])
            }
        } finally {
            if (!ctrl.signal.aborted) setLoading(false)
        }
    }, [])

    return { loading, results, search, setResults }
}

function normalizeCard(c: DbCard): DbCard {
    // defensively normalize fields the UI assumes are present
    return {
        scryfall_id: String(c.scryfall_id),
        oracle_id: c.oracle_id ?? null,
        name: String(c.name ?? ''),
        set_code: String(c.set_code ?? '').toUpperCase(),
        collector_number: String(c.collector_number ?? ''),
        image_small: c.image_small ?? null,
        image_normal: c.image_normal ?? null,
        tcgplayer_product_id:
            c.tcgplayer_product_id === null || c.tcgplayer_product_id === undefined
                ? null
                : Number(c.tcgplayer_product_id),
    }
}
