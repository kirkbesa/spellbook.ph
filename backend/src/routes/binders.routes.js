// backend/src/routes/binders.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { makeCrudRouter } from './_factory.js'
import { userClientFromToken, anon } from '../lib/supabase/supabaseAdminClient.js'
import { ensureFreshPrintsForOracle, warmCacheForQuery } from '../services/cardsCache.js'

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

// POST /api/binders/:id/bulk-add
router.post(
    '/:id/bulk-add',
    requireAuth,
    asyncHandler(async (req, res) => {
        const binderId = req.params.id
        const uid = req.user.id
        const rawCards = req.body.cards

        if (!Array.isArray(rawCards) || !rawCards.length) {
            return res.status(400).json({ error: 'Invalid payload' })
        }

        // Check ownership
        const { data: binder, error: bErr } = await req.supabase
            .from('binders')
            .select('id, owner_id')
            .eq('id', binderId)
            .single()
        if (bErr) return res.status(400).json({ error: bErr.message })
        if (!binder || binder.owner_id !== uid) return res.status(403).json({ error: 'Not owner' })

        const success = []
        const notFound = []

        for (const c of rawCards) {
            const name = c.name.trim()
            const qty = Number(c.qty ?? 1)
            console.log(`Searching for: ${qty} ${name}`)

            if (qty <= 0) continue

            // Try local DB first
            const { data: dbCards, error: cardErr } = await req.supabase
                .from('cards')
                .select('*')
                .ilike('name', name)
                .limit(1)

            let card = dbCards?.[0]

            // If not found, fetch from Scryfall
            if (!card) {
                try {
                    // Use named fuzzy search to get oracle_id
                    const namedResp = await fetch(
                        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`
                    )
                    const namedJson = await namedResp.json()
                    if (namedJson?.oracle_id) {
                        await ensureFreshPrintsForOracle(
                            namedJson.oracle_id,
                            namedJson.name ?? null
                        )
                        // Re-query DB for cached card
                        const { data: cached } = await req.supabase
                            .from('cards')
                            .select('id, name, oracle_id, scryfall_id')
                            .eq('oracle_id', namedJson.oracle_id)
                            .limit(1)
                        card = cached?.[0]
                    }
                } catch (err) {
                    console.error('[bulk-add] Scryfall fetch failed for', name, err)
                }
            }

            if (!card) {
                notFound.push(name)
                continue
            }

            // Check if identical listing exists
            const { data: existing } = await req.supabase
                .from('binder_cards')
                .select('id, quantity')
                .eq('binder_id', binderId)
                .eq('card_id', card.scryfall_id)
                .eq('condition', 'NM')
                .eq('finish', 'non_foil')
                .eq('language', 'EN')
                .limit(1)
                .maybeSingle()

            if (existing) {
                await req.supabase
                    .from('binder_cards')
                    .update({ quantity: (existing.quantity ?? 0) + qty })
                    .eq('id', existing.id)
            } else {
                await req.supabase.from('binder_cards').insert({
                    binder_id: binderId,
                    card_id: card.scryfall_id,
                    quantity: qty,
                    condition: 'NM',
                    finish: 'non_foil',
                    language: 'EN',
                    price_mode: 'scryfall',
                    fx_multiplier: 50,
                    listing_status: 'available',
                })
            }

            success.push({ name: c.name, qty })
        }

        res.json({ success, notFound })
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

// GET /api/binders/latest
router.get(
    '/latest',
    asyncHandler(async (req, res) => {
        const { limit = 10, filterBy = 'newly_created' } = req.query

        // Get date 24 hours ago to filter by "newly added cards"
        const sinceDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

        try {
            // Fetch binders based on filter type
            let bindersQuery = req.supabase
                .from('binders')
                .select(
                    'id, name, image_url, privacy, description, owner_id, created_at, updated_at, ' +
                        'users!inner(id, username, first_name, last_name, image_url, isverified, reputation, location), ' +
                        'binder_cards!inner(binder_id, updated_at)'
                )

            // Filter for "newly_created"
            if (filterBy === 'newly_created') {
                bindersQuery = bindersQuery.gte('created_at', sinceDate.toISOString())
            } else if (filterBy === 'with_new_cards') {
                // Filter for binders with cards added/updated within the last 24 hours
                bindersQuery = bindersQuery.gte('binder_cards.updated_at', sinceDate.toISOString())
            }

            const { data: binders, error } = await bindersQuery.limit(limit)

            // Fetch Total Binder Counts using their ID
            const binderIds = binders.map((binder) => binder.id)
            const { data: binderCardCounts, error: countError } = await req.supabase
                .from('binder_cards')
                .select('binder_id, quantity')
                .in('binder_id', binderIds)
                .eq('listing_status', 'available')

            if (countError) {
                console.error('Error fetching binder card counts:', countError)
            }
            const binderTotalCounts = new Map()
            binderCardCounts?.forEach((row) => {
                const current = binderTotalCounts.get(row.binder_id) || 0
                binderTotalCounts.set(row.binder_id, current + row.quantity)
            })
            binders.forEach((binder) => {
                binder.card_count = binderTotalCounts.get(binder.id) || 0
            })

            if (error) {
                console.error('Error fetching binders:', error)
                return res.status(400).json({ error: error.message })
            }

            res.json({ data: binders })
        } catch (error) {
            console.error('Error in latest binders route:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    })
)

// Reads public, writes auth
const crud = makeCrudRouter('binders', { orderBy: 'created_at', publicRead: true })
router.use('/', crud)

export default router
