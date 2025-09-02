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

        // 1) DB-first (FTS for >=3 chars, ILIKE otherwise)
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

        // 2) If miss, warm cache by query -> fuzzy named fallback -> requery
        if (!prints || prints.length === 0) {
            const warmedOracles = await warmCacheForQuery(q, 10).catch((e) => {
                console.error('[search] warmCacheForQuery error:', e)
                return []
            })

            if (warmedOracles.length === 0) {
                try {
                    const named = await (
                        await fetch(
                            `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(q)}`
                        )
                    ).json()
                    if (named?.oracle_id) {
                        await ensureFreshPrintsForOracle(named.oracle_id, named.name ?? null)
                    }
                } catch (e) {
                    console.error('[search] named fallback error:', e)
                }
            }

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
            // 3) Background freshness only for *stale* oracles
            const oracles = Array.from(new Set(prints.map((p) => p.oracle_id).filter(Boolean)))
            if (oracles.length) {
                const cutoffISO = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
                const { data: stale } = await anon
                    .from('oracles')
                    .select('oracle_id,last_synced_at')
                    .in('oracle_id', oracles)
                    .or(`last_synced_at.is.null,last_synced_at.lt.${cutoffISO}`)
                if (stale?.length) {
                    const staleIds = stale.map((r) => r.oracle_id)
                    Promise.all(staleIds.map((oid) => ensureFreshPrintsForOracle(oid))).catch(
                        () => {}
                    )
                }
            }
        }

        res.json({ query: q, prints })
    })
)

// Get All Prints
router.get(
    '/prints/:oracleId',
    asyncHandler(async (req, res) => {
        const { oracleId } = req.params
        const limit = Math.min(Number(req.query.limit) || 300, 500) // safety cap

        const { data, error } = await anon
            .from('cards')
            .select(COLS)
            .eq('oracle_id', oracleId)
            .limit(limit)

        if (error) return res.status(400).json({ error: error.message })
        ensureFreshPrintsForOracle(oracleId).catch(() => {})
        res.json({ data })
    })
)

// Public read CRUD (unchanged)
const crud = makeCrudRouter('cards', {
    orderBy: 'created_at',
    publicRead: true,
    idColumn: 'scryfall_id',
})
router.use('/', crud)

export default router
