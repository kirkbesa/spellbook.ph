// backend/src/routes/binders.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { makeCrudRouter } from './_factory.js'
import { userClientFromToken, anon } from '../lib/supabase/supabaseAdminClient.js'
import { ensureFreshPrintsForOracle } from '../services/cardsCache.js'

const router = express.Router()

router.get(
    '/mine',
    requireAuth,
    asyncHandler(async (req, res) => {
        const uid = req.user.id
        const { data: binders, error } = await req.supabase
            .from('binders')
            .select('id, owner_id, name, color_hex, pocket_layout, privacy, created_at, updated_at')
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
            .select('id, owner_id, name, color_hex, pocket_layout, privacy, created_at, updated_at')
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
            price_mode, // 'fixed' | 'tcgplayer'
            fixed_price, // number | null (if price_mode === 'fixed')
            tcg_basis, // 'listed_median' | 'market' | 'high' | 'low' (if 'tcgplayer')
        } = req.body ?? {}

        // 1) Ownership check
        const { data: binder, error: bErr } = await req.supabase
            .from('binders')
            .select('id, owner_id')
            .eq('id', binderId)
            .single()
        if (bErr) return res.status(400).json({ error: bErr.message })
        if (!binder || binder.owner_id !== uid) return res.status(403).json({ error: 'Not owner' })

        // 2) Resolve a specific print if only oracle_id provided
        let chosenPrintId = card_id ?? null
        let chosenOracleId = oracle_id ?? null

        if (!chosenPrintId && chosenOracleId) {
            // (A) STALENESS CHECK (await): keep cache fresh before selecting a print
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

        // If client provided card_id directly, we still want the oracle_id for (B)
        if (!chosenOracleId) {
            const { data: row, error: rErr } = await req.supabase
                .from('cards')
                .select('oracle_id, name')
                .eq('scryfall_id', chosenPrintId)
                .single()
            if (!rErr && row?.oracle_id) chosenOracleId = row.oracle_id
        }

        // 3) Basic payload with sensible defaults
        const normalizedLang = (language ?? 'EN').toUpperCase()
        const insertBase = {
            binder_id: binderId,
            card_id: chosenPrintId, // store specific print
            condition: condition ?? 'NM',
            finish: finish ?? 'non_foil',
            language: normalizedLang,
            price_mode: price_mode ?? 'tcgplayer',
            fixed_price: (price_mode ?? 'tcgplayer') === 'fixed' ? (fixed_price ?? 0) : null,
            tcg_basis:
                (price_mode ?? 'tcgplayer') === 'tcgplayer' ? (tcg_basis ?? 'listed_median') : null,
            listing_status: 'available',
        }

        const addQty = Number(quantity ?? 1)
        if (addQty <= 0) return res.status(400).json({ error: 'Quantity must be > 0' })

        // 4) Optional merge
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
            const { data, error } = await req.supabase
                .from('binder_cards')
                .update({ quantity: (existing.quantity ?? 0) + addQty })
                .eq('id', existing.id)
                .select(
                    'id, binder_id, card_id, quantity, finish, condition, language, price_mode, fixed_price, tcg_basis'
                )
                .single()
            if (error) return res.status(400).json({ error: error.message })

            // (B) BACKGROUND refresh to capture *all* prints for future searches
            if (chosenOracleId) ensureFreshPrintsForOracle(chosenOracleId).catch(() => {})
            return res.json({ data, merged: true })
        }

        // 5) Fresh insert
        const { data, error } = await req.supabase
            .from('binder_cards')
            .insert({ ...insertBase, quantity: addQty, reserved_quantity: 0 })
            .select(
                'id, binder_id, card_id, quantity, finish, condition, language, price_mode, fixed_price, tcg_basis'
            )
            .single()
        if (error) return res.status(400).json({ error: error.message })

        // (B) BACKGROUND refresh to capture *all* prints for future searches
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
        tcg_basis,
        computed_price,
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
          set_icon_svg_uri
        )
      `
            )
            .eq('binder_id', binderId)
            .order('created_at', { ascending: false })

        if (error) return res.status(400).json({ error: error.message })
        res.json({ data })
    })
)

// Reads public, writes auth
const crud = makeCrudRouter('binders', { orderBy: 'created_at', publicRead: true })
router.use('/', crud)

export default router
