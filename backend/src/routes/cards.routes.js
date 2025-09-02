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
        const qRaw = String(req.query.q ?? '').trim()
        const q = qRaw.replace(/\s+/g, ' ')
        if (!q) return res.json({ query: q, prints: [] })

        const terms = q.split(' ').filter(Boolean)
        const likePattern = `%${terms.join('%')}%`

        let prints = []
        let error = null

        // ---- 1) DB-first: FTS (+multi-term ILIKE) for >=3 chars, else ILIKE only ----
        if (q.length >= 3) {
            const [rFts, rLike] = await Promise.all([
                anon
                    .from('cards')
                    .select(COLS)
                    .textSearch('searchable', q, { type: 'websearch', config: 'simple' })
                    .order('synced_at', { ascending: false })
                    .limit(LIMIT),
                anon
                    .from('cards')
                    .select(COLS)
                    .ilike('name', likePattern)
                    .order('synced_at', { ascending: false })
                    .limit(LIMIT),
            ])

            if (rFts.error) error = rFts.error
            if (rLike.error) error ||= rLike.error
            if (error) return res.status(400).json({ error: error.message })

            // merge by scryfall_id, then sort by synced_at desc, and cap to LIMIT
            const byId = new Map()
            ;[...(rFts.data ?? []), ...(rLike.data ?? [])].forEach((row) => {
                if (!byId.has(row.scryfall_id)) byId.set(row.scryfall_id, row)
            })
            prints = Array.from(byId.values()).sort(
                (a, b) =>
                    Date.parse(b.synced_at ?? '1970-01-01') -
                    Date.parse(a.synced_at ?? '1970-01-01')
            )
            if (prints.length > LIMIT) prints = prints.slice(0, LIMIT)
        } else {
            const r = await anon
                .from('cards')
                .select(COLS)
                .ilike('name', likePattern) // multi-term substring: "%reckless%fire%"
                .order('synced_at', { ascending: false })
                .limit(LIMIT)
            if (r.error) return res.status(400).json({ error: r.error.message })
            prints = r.data ?? []
        }

        // ---- 2) If miss, warm cache -> fuzzy named fallback -> requery (unchanged) ----
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

            if (q.length >= 3) {
                const [rFts2, rLike2] = await Promise.all([
                    anon
                        .from('cards')
                        .select(COLS)
                        .textSearch('searchable', q, { type: 'websearch', config: 'simple' })
                        .order('synced_at', { ascending: false })
                        .limit(LIMIT),
                    anon
                        .from('cards')
                        .select(COLS)
                        .ilike('name', likePattern)
                        .order('synced_at', { ascending: false })
                        .limit(LIMIT),
                ])
                if (rFts2.error) return res.status(400).json({ error: rFts2.error.message })
                if (rLike2.error) return res.status(400).json({ error: rLike2.error.message })
                const byId2 = new Map()
                ;[...(rFts2.data ?? []), ...(rLike2.data ?? [])].forEach((row) => {
                    if (!byId2.has(row.scryfall_id)) byId2.set(row.scryfall_id, row)
                })
                prints = Array.from(byId2.values()).sort(
                    (a, b) =>
                        Date.parse(b.synced_at ?? '1970-01-01') -
                        Date.parse(a.synced_at ?? '1970-01-01')
                )
                if (prints.length > LIMIT) prints = prints.slice(0, LIMIT)
            } else {
                const r2 = await anon
                    .from('cards')
                    .select(COLS)
                    .ilike('name', likePattern)
                    .order('synced_at', { ascending: false })
                    .limit(LIMIT)
                if (r2.error) return res.status(400).json({ error: r2.error.message })
                prints = r2.data ?? []
            }
        } else {
            // ---- 3) Background freshness only for stale oracles (unchanged) ----
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
