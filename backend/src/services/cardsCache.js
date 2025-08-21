// backend/src/services/cardsCache.js
import { admin } from '../lib/supabase/supabaseAdminClient.js'

const DEFAULT_STALE_DAYS = 14

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
    await refreshOracleMeta(oracleId, oracleName)
}

export async function warmCachePrintsByOracle(oracleId) {
    console.log('[warm] start oracle:', oracleId)

    // ✅ use oracleid: (not oracle:)
    const q = `oracleid:${oracleId}`
    let next = `https://api.scryfall.com/cards/search?order=released&dir=desc&unique=prints&q=${encodeURIComponent(q)}&include_extras=false&include_variations=false`

    const upserts = []
    let total = 0

    while (next) {
        const resp = await fetch(next)
        if (!resp.ok) {
            const text = await resp.text().catch(() => '')
            console.error('[warm] fetch failed', resp.status, text.slice(0, 200))
            // Gracefully stop on 404 instead of throwing the whole flow
            if (resp.status === 404) break
            throw new Error(`scryfall ${resp.status}`)
        }
        const page = await resp.json()
        const data = page?.data ?? []
        total += data.length

        for (const c of data) {
            upserts.push({
                scryfall_id: c.id,
                oracle_id: c.oracle_id || oracleId,
                name: c.name,
                set_code: (c.set || '').toUpperCase(),
                collector_number: String(c.collector_number ?? ''),
                image_small: c.image_uris?.small ?? null,
                image_normal: c.image_uris?.normal ?? null,
                tcgplayer_product_id: c.tcgplayer_id ?? null,
                synced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
        }
        next = page.has_more ? page.next_page : null
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
    const base = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=prints&order=released&dir=desc&include_extras=false&include_variations=false`
    let url = base
    const oracleIds = new Set()

    while (url && oracleIds.size < maxOracles) {
        const r = await fetch(url)
        if (!r.ok) {
            const text = await r.text().catch(() => '')
            console.error('[warmQ] fetch failed', r.status, text.slice(0, 200))
            break
        }
        const json = await r.json()
        for (const c of json.data ?? []) {
            if (c.oracle_id) oracleIds.add(c.oracle_id)
            if (oracleIds.size >= maxOracles) break
        }
        url = json.has_more && oracleIds.size < maxOracles ? json.next_page : null
    }

    console.log('[warmQ] found oracles:', oracleIds.size)
    for (const oid of oracleIds) {
        await warmCachePrintsByOracle(oid)
    }
    return Array.from(oracleIds)
}

async function refreshOracleMeta(oracleId, name = null) {
    const { count } = await admin
        .from('cards')
        .select('scryfall_id', { count: 'exact', head: true })
        .eq('oracle_id', oracleId)

    await admin.from('oracles').upsert({
        oracle_id: oracleId,
        name,
        prints_count: count ?? 0,
        last_synced_at: new Date().toISOString(),
    })
}
