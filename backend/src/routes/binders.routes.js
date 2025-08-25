// backend/src/routes/binders.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { makeCrudRouter } from './_factory.js'
import { userClientFromToken, anon } from '../lib/supabase/supabaseAdminClient.js'
import { ensureFreshPrintsForOracle } from '../services/cardsCache.js'

const router = express.Router()

// small helper to pick Scryfall USD price by finish
function pickScryUsd(card, finish) {
    if (!card) return null
    if (finish === 'foil') return card.scry_usd_foil ?? card.scry_usd ?? null
    if (finish === 'etched')
        return card.scry_usd_etched ?? card.scry_usd_foil ?? card.scry_usd ?? null
    return card.scry_usd ?? null
}

router.get(
    '/mine',
    requireAuth,
    asyncHandler(async (req, res) => {
        const uid = req.user.id
        const { data: binders, error } = await req.supabase
            .from('binders')
            .select(
                'id, owner_id, name, description, color_hex, pocket_layout, image_url, privacy, created_at, updated_at'
            )
            .eq('owner_id', uid)
            .order('created_at', { ascending: false })
        if (error) return res.status(400).json({ error: error.message })

        const ids = (binders ?? []).map((b) => b.id)
        if (!ids.length) return res.json({ data: [] })

        const { data: items, error: e2 } = await req.supabase
            .from('binder_cards')
            .select('binder_id, quantity')
            .in('binder_id', ids)
        if (e2) return res.status(400).json({ error: e2.message })

        const counts = new Map()
        for (const it of items ?? [])
            counts.set(it.binder_id, (counts.get(it.binder_id) ?? 0) + Number(it.quantity ?? 0))

        res.json({ data: binders.map((b) => ({ ...b, card_count: counts.get(b.id) ?? 0 })) })
    })
)

// PUBLIC: list a user's public binders (anon allowed; RLS hides private)
router.get(
    '/by-user/:id',
    asyncHandler(async (req, res) => {
        const userId = req.params.id
        const { data: binders, error } = await req.supabase
            .from('binders')
            .select(
                'id, owner_id, name, description, color_hex, pocket_layout, image_url, privacy, created_at, updated_at'
            )
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })
        if (error) return res.status(400).json({ error: error.message })

        const ids = (binders ?? []).map((b) => b.id)
        if (!ids.length) return res.json({ data: [] })

        const { data: items, error: e2 } = await req.supabase
            .from('binder_cards')
            .select('binder_id, quantity')
            .in('binder_id', ids)
        if (e2) return res.status(400).json({ error: e2.message })

        const counts = new Map()
        for (const it of items ?? [])
            counts.set(it.binder_id, (counts.get(it.binder_id) ?? 0) + Number(it.quantity ?? 0))

        res.json({ data: binders.map((b) => ({ ...b, card_count: counts.get(b.id) ?? 0 })) })
    })
)

// POST /api/binders/:id/cards – owner adds a listing to binder_cards
router.post(
    '/:id/cards',
    requireAuth,
    asyncHandler(async (req, res) => {
        const binderId = req.params.id
        const uid = req.user.id
        const {
            card_id, // scryfall_id (specific print) -- preferred
            oracle_id, // fallback if client doesn’t know the print yet
            quantity,
            finish, // 'non_foil' | 'foil' | 'etched'
            condition, // 'NM' | 'LP' | ...
            language, // e.g. 'EN'
            price_mode, // 'fixed' | 'scryfall'
            fixed_price, // number | null (if price_mode === 'fixed')
            fx_multiplier, // number | null (for 'scryfall' dynamic pricing)
        } = req.body ?? {}

        // Ownership check
        const { data: binder, error: bErr } = await req.supabase
            .from('binders')
            .select('id, owner_id')
            .eq('id', binderId)
            .single()
        if (bErr) return res.status(400).json({ error: bErr.message })
        if (!binder || binder.owner_id !== uid) return res.status(403).json({ error: 'Not owner' })

        // Resolve specific print if only oracle_id provided
        let chosenPrintId = card_id ?? null
        let chosenOracleId = oracle_id ?? null

        if (!chosenPrintId && chosenOracleId) {
            await ensureFreshPrintsForOracle(chosenOracleId)
            const { data: prints, error: pErr } = await req.supabase
                .from('cards')
                .select('scryfall_id, synced_at')
                .eq('oracle_id', chosenOracleId)
                .order('synced_at', { ascending: false })
                .limit(1)
            if (pErr) return res.status(400).json({ error: pErr.message })
            if (!prints?.length)
                return res.status(404).json({ error: 'No prints found for oracle' })
            chosenPrintId = prints[0].scryfall_id
        }
        if (!chosenPrintId) {
            return res.status(400).json({ error: 'Provide card_id (scryfall_id) or oracle_id' })
        }

        // If only card_id was provided, still try to learn oracle to background warm later
        if (!chosenOracleId) {
            const { data: row } = await req.supabase
                .from('cards')
                .select('oracle_id')
                .eq('scryfall_id', chosenPrintId)
                .maybeSingle()
            if (row?.oracle_id) chosenOracleId = row.oracle_id
        }

        const normalizedLang = (language ?? 'EN').toUpperCase()
        const mode = price_mode ?? 'scryfall'
        const qty = Number(quantity ?? 1)
        if (qty <= 0) return res.status(400).json({ error: 'Quantity must be > 0' })

        // normalize multiplier
        const mult = fx_multiplier === '' || fx_multiplier == null ? null : Number(fx_multiplier)

        // base insert payload
        const insertBase = {
            binder_id: binderId,
            card_id: chosenPrintId,
            condition: condition ?? 'NM',
            finish: finish ?? 'non_foil',
            language: normalizedLang,
            price_mode: mode, // 'fixed' | 'scryfall'
            fixed_price: mode === 'fixed' ? (fixed_price ?? 0) : null,
            fx_multiplier: mode === 'scryfall' ? mult : null,
            listing_status: 'available',
        }

        // If dynamic + multiplier present, compute PHP now
        let computedPrice = null
        if (mode === 'scryfall' && mult && mult > 0) {
            const { data: cardRow } = await req.supabase
                .from('cards')
                .select('scry_usd, scry_usd_foil, scry_usd_etched')
                .eq('scryfall_id', chosenPrintId)
                .maybeSingle()

            const pickUsd = (c, f) => {
                if (!c) return null
                if (f === 'foil') return c.scry_usd_foil ?? c.scry_usd ?? null
                if (f === 'etched')
                    return c.scry_usd_etched ?? c.scry_usd_foil ?? c.scry_usd ?? null
                return c.scry_usd ?? null
            }
            const baseUsd = pickUsd(cardRow, insertBase.finish)
            if (baseUsd != null) computedPrice = baseUsd * mult
        }

        // Merge identical listing attrs
        const { data: existing, error: eErr } = await req.supabase
            .from('binder_cards')
            .select('id, quantity')
            .eq('binder_id', binderId)
            .eq('card_id', insertBase.card_id)
            .eq('condition', insertBase.condition)
            .eq('finish', insertBase.finish)
            .eq('language', insertBase.language)
            .eq('price_mode', insertBase.price_mode)
            .limit(1)
            .maybeSingle()
        if (eErr) return res.status(400).json({ error: eErr.message })

        if (existing) {
            const patch = { quantity: (existing.quantity ?? 0) + qty }

            if (insertBase.fx_multiplier != null) patch.fx_multiplier = insertBase.fx_multiplier
            if (computedPrice != null) {
                patch.computed_price = computedPrice
                patch.last_priced_at = new Date().toISOString()
            }

            const { data, error } = await req.supabase
                .from('binder_cards')
                .update(patch)
                .eq('id', existing.id)
                .select(
                    'id, binder_id, card_id, quantity, finish, condition, language, price_mode, fixed_price, fx_multiplier'
                )
                .single()
            if (error) return res.status(400).json({ error: error.message })
            if (chosenOracleId) ensureFreshPrintsForOracle(chosenOracleId).catch(() => {})
            return res.json({ data, merged: true })
        }

        // Fresh insert
        const insertRow = {
            ...insertBase,
            quantity: qty,
            reserved_quantity: 0,
            ...(computedPrice != null
                ? { computed_price: computedPrice, last_priced_at: new Date().toISOString() }
                : {}),
        }

        const { data, error } = await req.supabase
            .from('binder_cards')
            .insert(insertRow)
            .select(
                'id, binder_id, card_id, quantity, finish, condition, language, price_mode, fixed_price, fx_multiplier'
            )
            .single()
        if (error) return res.status(400).json({ error: error.message })

        if (chosenOracleId) ensureFreshPrintsForOracle(chosenOracleId).catch(() => {})
        res.json({ data, merged: false })
    })
)

// GET /api/binders/:id/cards
// Public can see if binder is public (RLS handles it). Owners (with token) can see private.
router.get(
    '/:id/cards',
    asyncHandler(async (req, res) => {
        const binderId = req.params.id
        const authHeader = req.headers.authorization || ''
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
        const client = token ? userClientFromToken(token) : anon

        const { data, error } = await client
            .from('binder_cards')
            .select(
                `
        id,
        binder_id,
        card_id,
        quantity,
        reserved_quantity,
        condition,
        finish,
        language,
        price_mode,
        fixed_price,
        fx_multiplier,
        computed_price,
        last_priced_at,
        listing_status,
        created_at,
        updated_at,
        card:card_id (
          scryfall_id,
          name,
          set_code,
          collector_number,
          image_small,
          image_normal,
          set_icon_svg_uri,
          scry_usd,
          scry_usd_foil,
          scry_usd_etched
        )
      `
            )
            .eq('binder_id', binderId)
            .order('created_at', { ascending: false })

        if (error) return res.status(400).json({ error: error.message })

        const items = (data ?? []).map((it) => {
            let display = null
            let currency = null

            if (it.price_mode === 'fixed') {
                display = it.fixed_price ?? 0
                currency = 'PHP'
            } else {
                // dynamic 'scryfall'
                const card = it.card || {}
                const usd =
                    it.finish === 'foil'
                        ? (card.scry_usd_foil ?? card.scry_usd ?? null)
                        : it.finish === 'etched'
                          ? (card.scry_usd_etched ?? card.scry_usd_foil ?? card.scry_usd ?? null)
                          : (card.scry_usd ?? null)

                if (it.fx_multiplier && usd != null) {
                    // we have a multiplier → show PHP (prefer computed_price from DB, else compute on the fly)
                    display = it.computed_price ?? usd * it.fx_multiplier
                    currency = 'PHP'
                } else {
                    // no multiplier → only USD is meaningful
                    display = usd
                    currency = 'USD'
                }
            }

            it.display_price = display
            it.price_currency = currency
            return it
        })

        res.json({ data: items })
    })
)

// Reads public, writes auth
const crud = makeCrudRouter('binders', { orderBy: 'created_at', publicRead: true })
router.use('/', crud)

export default router
