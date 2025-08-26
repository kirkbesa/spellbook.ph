// backend/src/routes/cards.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { makeCrudRouter } from './_factory.js'
import { anon } from '../lib/supabase/supabaseAdminClient.js'
import {
    ensureFreshPrintsForOracle,
    warmCacheForQuery,
    warmCachePrintsByOracle,
} from '../services/cardsCache.js'

const router = express.Router()

const COLS =
    'scryfall_id, oracle_id, name, set_code, collector_number, image_small, image_normal, tcgplayer_product_id, set_icon_svg_uri, scry_usd, scry_usd_foil, scry_usd_etched, scry_prices_updated_at, synced_at, created_at'
const LIMIT = 200

router.get(
    '/search',
    asyncHandler(async (req, res) => {
        const q = String(req.query.q ?? '').trim()
        if (!q) return res.json({ query: q, prints: [] })

        let prints = []
        let error = null

        // 1) DB-first: use fast FTS on the indexed tsvector (fallback to ILIKE for very short queries)
        if (q.length >= 3) {
            const r = await anon
                .from('cards')
                .select(COLS)
                .textSearch('searchable', q, { type: 'websearch', config: 'simple' })
                .order('synced_at', { ascending: false })
                .limit(LIMIT)
            error = r.error
            prints = r.data ?? []
        } else {
            const r = await anon
                .from('cards')
                .select(COLS)
                .ilike('name', `%${q}%`)
                .order('synced_at', { ascending: false })
                .limit(LIMIT)
            error = r.error
            prints = r.data ?? []
        }

        if (error) return res.status(400).json({ error: error.message })

        // 2) If miss, warm cache by query -> fuzzy named fallback -> requery (FTS preferred)
        if (!prints || prints.length === 0) {
            const warmedOracles = await warmCacheForQuery(q, 10).catch((e) => {
                console.error('[search] warmCacheForQuery error:', e)
                return []
            })

            if (warmedOracles.length === 0) {
                // named fuzzy fallback (helps “thassa”, typos, etc.)
                try {
                    const named = await (
                        await fetch(
                            `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(q)}`
                        )
                    ).json()
                    if (named?.oracle_id) {
                        await warmCachePrintsByOracle(named.oracle_id)
                    }
                } catch (e) {
                    console.error('[search] named fallback error:', e)
                }
            }

            // Requery after warming (FTS if possible)
            const r2 =
                q.length >= 3
                    ? await anon
                          .from('cards')
                          .select(COLS)
                          .textSearch('searchable', q, { type: 'websearch', config: 'simple' })
                          .order('synced_at', { ascending: false })
                          .limit(LIMIT)
                    : await anon
                          .from('cards')
                          .select(COLS)
                          .ilike('name', `%${q}%`)
                          .order('synced_at', { ascending: false })
                          .limit(LIMIT)

            if (r2.error) return res.status(400).json({ error: r2.error.message })
            prints = r2.data ?? []
        } else {
            // 3) Background freshness: update prints/prices for the oracles we already have
            const oracles = Array.from(new Set(prints.map((p) => p.oracle_id).filter(Boolean)))
            Promise.all(oracles.map((oid) => ensureFreshPrintsForOracle(oid))).catch(() => {})
        }

        res.json({ query: q, prints })
    })
)

// Public read CRUD (unchanged)
const crud = makeCrudRouter('cards', { orderBy: 'created_at', publicRead: true })
router.use('/', crud)

export default router
