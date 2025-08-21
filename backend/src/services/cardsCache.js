// backend/src/services/cardsCache.js
import { admin } from '../lib/supabase/supabaseAdminClient.js'

const DEFAULT_STALE_DAYS = 14
const setIconCache = new Map() // Map<SET_CODE (UPPERCASE), icon_svg_uri | null>

export async function ensureFreshPrintsForOracle(
    oracleId,
    oracleName = null,
    { staleDays = DEFAULT_STALE_DAYS } = {}
) {
    if (!oracleId) return

    const { data: meta } = await admin
        .from('oracles')
        .select('oracle_id, last_synced_at')
        .eq('oracle_id', oracleId)
        .maybeSingle()

    const stale =
        !meta?.last_synced_at || Date.now() - Date.parse(meta.last_synced_at) > staleDays * 864e5

    if (!stale) return

    await warmCachePrintsByOracle(oracleId)
    await refreshOracleMeta(oracleId, oracleName || null) // only writes name if provided/derived
}

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
                // set_icon_svg_uri filled after set metadata fetch
                synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
        }
        next = page.has_more ? page.next_page : null
    }

    // Fetch set icons once per set_code (with in-process cache)
    const icons = await fetchSetIcons(Array.from(setCodes))

    // Hydrate upserts with icon URIs
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
        await warmCachePrintsByOracle(oid)
        // Pass along a known name so the first oracle row is not nameless
        await refreshOracleMeta(oid, nameByOracle.get(oid) ?? null)
    }
    return Array.from(oracleIds)
}

// --- helpers ---

// Fetch set metadata for a list of set codes and return a map { SET_CODE: icon_svg_uri }
async function fetchSetIcons(codes) {
    const out = {}
    const unique = Array.from(new Set((codes ?? []).map((c) => (c || '').toLowerCase()))).filter(
        Boolean
    )

    for (const codeLower of unique) {
        const keyUpper = codeLower.toUpperCase()

        // simple in-process memoization
        if (setIconCache.has(keyUpper)) {
            out[keyUpper] = setIconCache.get(keyUpper)
            continue
        }

        try {
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
    // 1) Count prints
    const { count } = await admin
        .from('cards')
        .select('scryfall_id', { count: 'exact', head: true })
        .eq('oracle_id', oracleId)

    // 2) If name not provided, prefer existing oracles.name
    if (!name) {
        const { data: existing } = await admin
            .from('oracles')
            .select('name')
            .eq('oracle_id', oracleId)
            .maybeSingle()
        if (existing?.name) name = existing.name
    }

    // 3) Still no name? Derive from cards (warm has already inserted prints)
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

    // 4) Upsert — only include `name` if we have one (never overwrite with null)
    const payload = {
        oracle_id: oracleId,
        prints_count: count ?? 0,
        last_synced_at: new Date().toISOString(),
    }
    if (name) payload.name = name

    const { error } = await admin.from('oracles').upsert(payload)
    if (error) throw error
}
