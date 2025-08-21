// backend/src/routes/cards.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { makeCrudRouter } from './_factory.js'
import { admin, anon } from '../lib/supabase/supabaseAdminClient.js'

const router = express.Router()

/**
 * GET /api/cards/search?q=...
 * - Search DB first (prefix + ILIKE)
 * - If none, fallback to Scryfall
 */
router.get(
    '/search',
    asyncHandler(async (req, res) => {
        const q = String(req.query.q ?? '').trim()
        if (!q) return res.json({ db: [], scryfall: [] })

        // DB search (prefix or contains)
        const { data: dbHits, error: dbErr } = await anon
            .from('cards')
            .select(
                'scryfall_id, oracle_id, name, set_code, collector_number, image_small, image_normal, tcgplayer_product_id'
            )
            .or(`name.ilike.${q}%,name.ilike.%${q}%`)
            .order('set_code', { ascending: false })
            .limit(50)

        if (dbErr) return res.status(400).json({ error: dbErr.message })

        if (dbHits?.length) {
            return res.json({ db: dbHits, scryfall: [] })
        }

        // Scryfall fallback — get all printings (paginate)
        const base = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=prints&order=released&dir=desc&include_extras=false&include_variations=false`
        let url = base
        let scryfall = []
        for (let i = 0; i < 4; i++) {
            // up to 4 pages ~ 200+ total; adjust down if you want
            const r = await fetch(url)
            if (!r.ok) break
            const json = await r.json()
            const page = (json?.data ?? []).map((c) => ({
                scryfall_id: c.id,
                oracle_id: c.oracle_id ?? null,
                name: c.name,
                set_code: c.set?.toUpperCase?.() || c.set,
                collector_number: c.collector_number,
                image_small: c.image_uris?.small ?? null,
                image_normal: c.image_uris?.normal ?? null,
                tcgplayer_product_id: c.tcgplayer_id ?? null,
            }))
            scryfall.push(...page)
            if (!json?.has_more || !json?.next_page) break
            // stop if large
            if (scryfall.length >= 80) break
            url = json.next_page
        }

        res.json({ db: [], scryfall })
    })
)

/**
 * POST /api/cards/cache
 * Body: {
 *   scryfall_id, oracle_id?, name, set_code, collector_number,
 *   image_small?, image_normal?, tcgplayer_product_id?
 * }
 * - Upserts a printing into public.cards
 * - Uses service-role (admin) because RLS on cards only allows SELECT
 */
router.post(
    '/cache',
    asyncHandler(async (req, res) => {
        const b = req.body ?? {}
        const payload = {
            scryfall_id: b.scryfall_id,
            oracle_id: b.oracle_id ?? null,
            name: b.name,
            set_code: b.set_code,
            collector_number: b.collector_number,
            image_small: b.image_small ?? null,
            image_normal: b.image_normal ?? null,
            tcgplayer_product_id: b.tcgplayer_product_id ?? null,
        }
        if (
            !payload.scryfall_id ||
            !payload.name ||
            !payload.set_code ||
            !payload.collector_number
        ) {
            return res.status(400).json({ error: 'Missing required card fields' })
        }
        const { data, error } = await admin
            .from('cards')
            .upsert(payload, { onConflict: 'scryfall_id' })
            .select(
                'scryfall_id, oracle_id, name, set_code, collector_number, image_small, image_normal, tcgplayer_product_id'
            )
            .single()
        if (error) return res.status(400).json({ error: error.message })
        res.json({ data })
    })
)

// --- Keep your CRUD, but mount it AFTER custom endpoints ---
const crud = makeCrudRouter('cards', { orderBy: 'created_at', publicRead: true })
router.use('/', crud)

export default router
