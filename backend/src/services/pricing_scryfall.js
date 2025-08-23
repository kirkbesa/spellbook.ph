// backend/src/services/pricing_scryfall.js
import { admin } from '../lib/supabase/supabaseAdminClient.js'

const pickScry = (c, finish) => {
    if (!c) return null
    if (finish === 'foil') return c.scry_usd_foil ?? c.scry_usd ?? null
    if (finish === 'etched') return c.scry_usd_etched ?? c.scry_usd_foil ?? c.scry_usd ?? null
    return c.scry_usd ?? null
}

export async function repriceBinderCardsFromScryfall({
    binderId = null,
    binderCardIds = null,
} = {}) {
    // only dynamic rows
    let q = admin
        .from('binder_cards')
        .select('id, binder_id, card_id, finish, price_mode, fx_multiplier')
        .eq('price_mode', 'scryfall')

    if (binderId) q = q.eq('binder_id', binderId)
    if (binderCardIds?.length) q = q.in('id', binderCardIds)

    const { data: bc, error: e1 } = await q
    if (e1) throw new Error(e1.message)
    if (!bc?.length) return { updated: 0 }

    const cardIds = Array.from(new Set(bc.map((r) => r.card_id)))
    const { data: cards, error: e2 } = await admin
        .from('cards')
        .select('scryfall_id, scry_usd, scry_usd_foil, scry_usd_etched')
        .in('scryfall_id', cardIds)
    if (e2) throw new Error(e2.message)

    const byId = new Map(cards.map((c) => [c.scryfall_id, c]))
    let updated = 0

    for (const row of bc) {
        const card = byId.get(row.card_id)
        const usd = pickScry(card, row.finish)
        if (usd == null) continue

        // If we have a multiplier, compute PHP; else store USD so UI can show $.
        const newComputed =
            row.fx_multiplier && row.fx_multiplier > 0 ? usd * row.fx_multiplier : usd

        const { error: e3 } = await admin
            .from('binder_cards')
            .update({ computed_price: newComputed, last_priced_at: new Date().toISOString() })
            .eq('id', row.id)
        if (e3) throw new Error(e3.message)
        updated++
    }

    return { updated }
}
