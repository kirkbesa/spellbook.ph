// backend/src/jobs/dailyPriceRefresh.js
import cron from 'node-cron'
import { refreshStaleOracles } from '../services/cardsCache.js'
import { repriceBinderCardsFromScryfall } from '../services/pricing_scryfall.js'

export function startDailyPriceJobs() {
    // Runs every day at 3:15 AM (server time). Set timezone if you want.
    cron.schedule(
        '15 3 * * *',
        async () => {
            console.log('[cron] Daily price refresh: start')
            try {
                const a = await refreshStaleOracles({ staleHours: 24 })
                console.log('[cron] Stale oracles refreshed:', a.refreshed)

                const b = await repriceBinderCardsFromScryfall({})
                console.log('[cron] Binder cards repriced:', b.updated)
            } catch (e) {
                console.error('[cron] refresh error:', e?.message ?? e)
            }
            console.log('[cron] Daily price refresh: done')
        } /*, { timezone: 'Asia/Manila' }*/
    )
}
