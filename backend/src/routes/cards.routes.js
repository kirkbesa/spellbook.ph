// backend/src/routes/cards.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { makeCrudRouter } from './_factory.js'
import { admin, anon } from '../lib/supabase/supabaseAdminClient.js'
import {
    ensureFreshPrintsForOracle,
    warmCacheForQuery,
    warmCachePrintsByOracle,
} from '../services/cardsCache.js'

const router = express.Router()

router.get(
    '/search',
    asyncHandler(async (req, res) => {
        const q = String(req.query.q ?? '').trim()
        if (!q) return res.json({ query: q, prints: [] })

        const cols =
            'scryfall_id, oracle_id, name, set_code, collector_number, image_small, image_normal, tcgplayer_product_id, synced_at, created_at'

        // 1) DB-first
        let { data: prints, error } = await anon
            .from('cards')
            .select(cols)
            .or(`name.ilike.${q}%,name.ilike.%${q}%`)
            .order('synced_at', { ascending: false })
            .limit(200)

        if (error) return res.status(400).json({ error: error.message })

        // 2) If miss, warm cache by query
        if (!prints || prints.length === 0) {
            // try broad search -> collect oracles -> warm
            const warmedOracles = await warmCacheForQuery(q, 10).catch((e) => {
                console.error('[search] warmCacheForQuery error:', e)
                return []
            })

            // named fallback if nothing was found (handles “thassa” style)
            if (warmedOracles.length === 0) {
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

            // requery DB
            const retry = await anon
                .from('cards')
                .select(cols)
                .or(`name.ilike.${q}%,name.ilike.%${q}%`)
                .order('synced_at', { ascending: false })
                .limit(200)
            if (retry.error) return res.status(400).json({ error: retry.error.message })
            prints = retry.data ?? []
        } else {
            // 3) background staleness checks for oracles we already have
            const oracles = Array.from(new Set(prints.map((p) => p.oracle_id).filter(Boolean)))
            Promise.all(oracles.map((oid) => ensureFreshPrintsForOracle(oid))).catch(() => {})
        }

        res.json({ query: q, prints })
    })
)

const crud = makeCrudRouter('cards', { orderBy: 'created_at', publicRead: true })
router.use('/', crud)

export default router
