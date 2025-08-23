// src/hooks/binders/useAddBinderCard.ts
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import type { DbCard, PriceMode, CardCondition, CardFinish } from '@/pages/binders/components/types'

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
            price_mode: PriceMode // 'fixed' | 'scryfall'
            fixed_price?: number | null
            fx_multiplier?: number | null // used when price_mode === 'scryfall'
        }) => {
            setSaving(true)
            try {
                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token
                if (!token) throw new Error('Not authenticated')

                // If selected from Scryfall, cache to DB first (so we have a row in public.cards)
                let cardId = args.selected.card.scryfall_id
                if (args.selected.source === 'scryfall') {
                    const r = await fetch(`${API_BASE}/api/cards/cache`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(args.selected.card),
                    })
                    const j = await r.json().catch(() => ({}))
                    if (!r.ok) {
                        throw new Error(j?.error || 'Failed to cache card')
                    }
                    cardId = j.data?.scryfall_id ?? cardId
                }

                // Normalize numbers
                const qty = Math.max(1, Number(args.quantity || 1))
                const fixedPrice =
                    args.price_mode === 'fixed' ? Number(args.fixed_price ?? 0) : null
                const fxMultiplier =
                    args.price_mode === 'scryfall'
                        ? args.fx_multiplier == null
                            ? null
                            : Number(args.fx_multiplier)
                        : null

                // Add to binder_cards
                const res = await fetch(`${API_BASE}/api/binders/${binderId}/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        // prefer passing oracle_id too if present (backend may warm cache)
                        oracle_id: args.selected.card.oracle_id ?? null,
                        card_id: cardId,
                        quantity: qty,
                        finish: args.finish,
                        condition: args.condition,
                        language: args.language,
                        price_mode: args.price_mode, // 'fixed' | 'scryfall'
                        fixed_price: fixedPrice,
                        fx_multiplier: fxMultiplier, // persisted when 'scryfall'
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
