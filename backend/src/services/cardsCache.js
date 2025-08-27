// backend/src/services/cardsCache.js
import { admin } from '../lib/supabase/supabaseAdminClient.js'
// --- at top (optional but useful) ---
const DEFAULT_STALE_DAYS = 14
const setIconCache = new Map()

// Simple counters so you can see Scryfall pressure in logs if you want
let scryfallHits = { cardsSearch: 0, sets: 0 }
export const getScryfallHitCounts = () => ({ ...scryfallHits })

export async function ensureFreshPrintsForOracle(
    oracleId,
    oracleName = null,
    { staleDays = DEFAULT_STALE_DAYS } = {}
) {
    if (!oracleId) return

    const cutoffISO = new Date(Date.now() - staleDays * 864e5).toISOString()

    // Read current freshness
    const { data: meta, error: readErr } = await admin
        .from('oracles')
        .select('oracle_id, last_synced_at')
        .eq('oracle_id', oracleId)
        .maybeSingle()
    if (readErr) {
        console.warn('[ensureFresh] read error', readErr)
        return
    }

    const fresh = meta?.last_synced_at && Date.parse(meta.last_synced_at) > Date.parse(cutoffISO)
    if (fresh) {
        // already fresh; nothing to do
        return
    }

    // --- Lease: only one worker refreshes a stale oracle ---
    const { data: leased, error: leaseErr } = await admin
        .from('oracles')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('oracle_id', oracleId)
        .or(`last_synced_at.is.null,last_synced_at.lt.${cutoffISO}`)
        .select('oracle_id')
        .maybeSingle()

    if (leaseErr) {
        console.warn('[ensureFresh] lease error', leaseErr)
        return
    }
    if (!leased) {
        // someone else just leased/refreshed it
        return
    }

    console.log('[ensureFresh] lease acquired → warming', oracleId)
    await warmCachePrintsByOracle(oracleId)
    await refreshOracleMeta(oracleId, oracleName || null)
}

const num = (v) => (v == null || v === '' ? null : Number(v))

export async function warmCachePrintsByOracle(oracleId) {
    console.log('[warm] start oracle:', oracleId)

    const q = `oracleid:${oracleId}`
    let next = `https://api.scryfall.com/cards/search?order=released&dir=desc&unique=prints&q=${encodeURIComponent(
        q
    )}&include_extras=false&include_variations=false`

    const upserts = []
    let total = 0
    const setCodes = new Set()

    while (next) {
        scryfallHits.cardsSearch++
        const resp = await fetch(next)
        if (!resp.ok) {
            const text = await resp.text().catch(() => '')
            console.error('[warm] fetch failed', resp.status, text.slice(0, 200))
            if (resp.status === 404) break
            throw new Error(`scryfall ${resp.status}`)
        }
        const page = await resp.json()
        const data = page?.data ?? []
        total += data.length

        for (const c of data) {
            const set_code = (c.set || '').toUpperCase()
            if (set_code) setCodes.add(set_code)

            upserts.push({
                scryfall_id: c.id,
                oracle_id: c.oracle_id || oracleId,
                name: c.name,
                set_code,
                collector_number: String(c.collector_number ?? ''),
                image_small: c.image_uris?.small ?? null,
                image_normal: c.image_uris?.normal ?? null,
                tcgplayer_product_id: c.tcgplayer_id ?? null,
                scry_usd: num(c.prices?.usd),
                scry_usd_foil: num(c.prices?.usd_foil),
                scry_usd_etched: num(c.prices?.usd_etched),
                scry_prices_updated_at: new Date().toISOString(),
                // set_icon_svg_uri is filled after set metadata fetch
                synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
        }
        next = page.has_more ? page.next_page : null
    }

    // Fetch set icons once per set_code (memoized)
    const icons = await fetchSetIcons(Array.from(setCodes))
    for (const u of upserts) {
        u.set_icon_svg_uri = u.set_code ? (icons[u.set_code] ?? null) : null
    }

    console.log('[warm] fetched prints:', total, 'upserting:', upserts.length)
    if (upserts.length) {
        const { error } = await admin.from('cards').upsert(upserts, { onConflict: 'scryfall_id' })
        if (error) {
            console.error('[warm] upsert error:', error)
            throw error
        }
    }
    console.log('[warm] done oracle:', oracleId)
}

export async function warmCacheForQuery(q, maxOracles = 10) {
    console.log('[warmQ] query:', q)
    const base = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(
        q
    )}&unique=prints&order=released&dir=desc&include_extras=false&include_variations=false`

    let url = base
    const oracleIds = new Set()
    const nameByOracle = new Map()

    while (url && oracleIds.size < maxOracles) {
        scryfallHits.cardsSearch++
        const r = await fetch(url)
        if (!r.ok) {
            const text = await r.text().catch(() => '')
            console.error('[warmQ] fetch failed', r.status, text.slice(0, 200))
            break
        }
        const json = await r.json()
        for (const c of json.data ?? []) {
            if (c.oracle_id) {
                if (!nameByOracle.has(c.oracle_id) && c.name) {
                    nameByOracle.set(c.oracle_id, c.name)
                }
                oracleIds.add(c.oracle_id)
                if (oracleIds.size >= maxOracles) break
            }
        }
        url = json.has_more && oracleIds.size < maxOracles ? json.next_page : null
    }

    console.log('[warmQ] found oracles:', oracleIds.size)
    for (const oid of oracleIds) {
        // 🔁 route through freshness gate (no-op if fresh)
        await ensureFreshPrintsForOracle(oid, nameByOracle.get(oid) ?? null)
    }
    return Array.from(oracleIds)
}

// Fetch set metadata for a list of set codes and return a map { SET_CODE: icon_svg_uri }
async function fetchSetIcons(codes) {
    const out = {}
    const unique = Array.from(new Set((codes ?? []).map((c) => (c || '').toLowerCase()))).filter(
        Boolean
    )

    for (const codeLower of unique) {
        const keyUpper = codeLower.toUpperCase()

        if (setIconCache.has(keyUpper)) {
            out[keyUpper] = setIconCache.get(keyUpper)
            continue
        }

        try {
            scryfallHits.sets++
            const resp = await fetch(`https://api.scryfall.com/sets/${codeLower}`)
            if (!resp.ok) {
                const text = await resp.text().catch(() => '')
                console.warn('[sets] fetch failed', codeLower, resp.status, text.slice(0, 120))
                setIconCache.set(keyUpper, null)
                out[keyUpper] = null
                continue
            }
            const s = await resp.json()
            const uri = s?.icon_svg_uri ?? null
            setIconCache.set(keyUpper, uri)
            out[keyUpper] = uri
        } catch (e) {
            console.warn('[sets] fetch exception', codeLower, e)
            setIconCache.set(keyUpper, null)
            out[keyUpper] = null
        }
    }
    return out
}

async function refreshOracleMeta(oracleId, name = null) {
    const { count } = await admin
        .from('cards')
        .select('scryfall_id', { count: 'exact', head: true })
        .eq('oracle_id', oracleId)

    if (!name) {
        const { data: existing } = await admin
            .from('oracles')
            .select('name')
            .eq('oracle_id', oracleId)
            .maybeSingle()
        if (existing?.name) name = existing.name
    }

    if (!name) {
        const { data: fromCards } = await admin
            .from('cards')
            .select('name')
            .eq('oracle_id', oracleId)
            .order('synced_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        if (fromCards?.name) name = fromCards.name
    }

    const payload = {
        oracle_id: oracleId,
        prints_count: count ?? 0,
        last_synced_at: new Date().toISOString(),
    }
    if (name) payload.name = name

    const { error } = await admin.from('oracles').upsert(payload)
    if (error) throw error
}

// Refresh stale oracles batch (unchanged, uses last_synced_at)
export async function refreshStaleOracles({ staleHours = 24, limit = 1000 } = {}) {
    const cutoffIso = new Date(Date.now() - staleHours * 3600 * 1000).toISOString()
    const { data: stale, error } = await admin
        .from('oracles')
        .select('oracle_id, name, last_synced_at')
        .or(`last_synced_at.is.null,last_synced_at.lt.${cutoffIso}`)
        .limit(limit)

    if (error) throw new Error(`[refreshStaleOracles] ${error.message}`)
    if (!stale?.length) return { refreshed: 0 }

    let refreshed = 0
    for (const o of stale) {
        try {
            await warmCachePrintsByOracle(o.oracle_id)
            await refreshOracleMeta(o.oracle_id, o.name ?? null)
            refreshed++
        } catch (e) {
            console.warn('[refreshStaleOracles] failed for', o.oracle_id, e?.message ?? e)
        }
    }
    return { refreshed }
}
