// backend/src/routes/binders.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { makeCrudRouter } from './_factory.js'
import { userClientFromToken, anon } from '../lib/supabase/supabaseAdminClient.js'

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
            card_id, // scryfall_id
            quantity,
            finish, // 'non_foil' | 'foil' | 'etched'
            condition, // 'NM' | 'LP' | ...
            language, // e.g. 'EN'
            price_mode, // 'fixed' | 'tcgplayer'
            fixed_price, // number | null (if price_mode === 'fixed')
            tcg_basis, // 'listed_median' | 'market' | 'high' | 'low' (if 'tcgplayer')
        } = req.body ?? {}

        // Check binder ownership
        const { data: binder, error: bErr } = await req.supabase
            .from('binders')
            .select('id, owner_id')
            .eq('id', binderId)
            .single()
        if (bErr) return res.status(400).json({ error: bErr.message })
        if (!binder || binder.owner_id !== uid) return res.status(403).json({ error: 'Not owner' })

        if (!card_id || !quantity || quantity <= 0) {
            return res.status(400).json({ error: 'Missing card_id or quantity' })
        }

        const insert = {
            binder_id: binderId,
            card_id,
            quantity,
            finish: finish ?? 'non_foil',
            condition: condition ?? 'NM',
            language: language ?? 'EN',
            price_mode: price_mode ?? 'fixed',
            fixed_price: price_mode === 'fixed' ? (fixed_price ?? 0) : null,
            tcg_basis: price_mode === 'tcgplayer' ? (tcg_basis ?? 'listed_median') : null,
        }

        const { data, error } = await req.supabase
            .from('binder_cards')
            .insert(insert)
            .select(
                'id, binder_id, card_id, quantity, finish, condition, language, price_mode, fixed_price, tcg_basis'
            )
            .single()

        if (error) return res.status(400).json({ error: error.message })
        res.json({ data })
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
          image_normal
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
