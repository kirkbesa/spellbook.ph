// src/hooks/binders/useAddBinderCard.ts
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import type {
    DbCard,
    PriceMode,
    CardCondition,
    CardFinish,
    TcgBasis,
} from '@/pages/binders/components/types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export function useAddBinderCard(binderId: string) {
    const [saving, setSaving] = React.useState(false)
    const add = React.useCallback(
        async (args: {
            selected: { source: 'db' | 'scryfall'; card: DbCard }
            quantity: number
            finish: CardFinish
            condition: CardCondition
            language: string
            price_mode: PriceMode
            fixed_price?: number | null
            tcg_basis?: TcgBasis | null
        }) => {
            setSaving(true)
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                if (!token) throw new Error('Not authenticated')

                // If selected from scryfall, cache to DB first
                let cardId = args.selected.card.scryfall_id
                if (args.selected.source === 'scryfall') {
                    const r = await fetch(`${API_BASE}/api/cards/cache`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(args.selected.card),
                    })
                    if (!r.ok) {
                        const b = await r.json().catch(() => ({}))
                        throw new Error(b?.error || 'Failed to cache card')
                    }
                    const { data } = await r.json()
                    cardId = data.scryfall_id
                }

                // Add to binder_cards
                const res = await fetch(`${API_BASE}/api/binders/${binderId}/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        card_id: cardId,
                        quantity: args.quantity,
                        finish: args.finish,
                        condition: args.condition,
                        language: args.language,
                        price_mode: args.price_mode,
                        fixed_price: args.price_mode === 'fixed' ? (args.fixed_price ?? 0) : null,
                        tcg_basis:
                            args.price_mode === 'tcgplayer'
                                ? (args.tcg_basis ?? 'listed_median')
                                : null,
                    }),
                })
                if (!res.ok) {
                    const b = await res.json().catch(() => ({}))
                    throw new Error(b?.error || 'Failed to add card')
                }
                return true
            } finally {
                setSaving(false)
            }
        },
        [binderId]
    )

    return { add, saving }
}
