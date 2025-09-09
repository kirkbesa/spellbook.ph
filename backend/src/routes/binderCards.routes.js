// backend/src/routes/binderCards.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { makeCrudRouter } from './_factory.js'

const router = express.Router()

// Utility functions for better card name matching
function normalizeCardName(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[’‘']/g, "'") // apostrophes to straight
        .replace(/[“”"]/g, '"') // quotes to straight
        .replace(/\s+/g, ' ')
}

function cardNameMatches(cardName, searchName) {
    const normalizedCard = normalizeCardName(cardName)
    const normalizedSearch = normalizeCardName(searchName)

    // Exact match
    if (normalizedCard === normalizedSearch) return true

    // Contains match
    if (normalizedCard.includes(normalizedSearch)) return true

    // Split search term and check if all words are in card name
    const searchWords = normalizedSearch.split(' ').filter((word) => word.length > 2)
    if (searchWords.length > 1) {
        const allWordsMatch = searchWords.every((word) => normalizedCard.includes(word))
        if (allWordsMatch) return true
    }

    return false
}

// POST /api/binder-cards/bulk - Bulk search for cards across binders
router.post(
    '/bulk',
    asyncHandler(async (req, res) => {
        const { searchItems } = req.body

        if (!searchItems || !Array.isArray(searchItems) || searchItems.length === 0) {
            return res.status(400).json({ error: 'No search items provided' })
        }

        const isValidSearchItems = searchItems.every(
            (item) => item && typeof item.name === 'string' && typeof item.qty === 'number'
        )
        if (!isValidSearchItems) {
            return res.status(400).json({ error: 'Invalid search items format' })
        }

        // Build normalized search list once
        const normalizedSearchList = searchItems.map((si) => ({
            name: si.name,
            qty: si.qty,
            key: normalizeCardName(si.name),
        }))

        try {
            // Build OR list for `cards.name` (unqualified col names because we use foreignTable)
            const orConditions = searchItems
                .map(({ name }) => {
                    const normalized = normalizeCardName(name).replace(/\s+/g, '*') // space-insensitive
                    const value = normalized.includes(',') ? `"*${normalized}*"` : `*${normalized}*`
                    return `name.ilike.${value}`
                })
                .join(',')

            const { data: matchingCards, error: cardsError } = await req.supabase
                .from('binder_cards')
                .select(
                    `
            id,
            binder_id,
            quantity,
            listing_status,
            cards!inner(
              name,
              scryfall_id
            ),
            binders!inner(
              id,
              name,
              image_url,
              privacy,
              description,
              owner_id,
              users!inner(
                id,
                username,
                first_name,
                last_name,
                image_url,
                isverified,
                reputation,
                location
              )
            )
          `
                )
                .or(orConditions, { foreignTable: 'cards' })
                .eq('listing_status', 'available')
                .in('binders.privacy', ['public', 'unlisted'])
                .limit(1000)

            if (cardsError) {
                console.error('Error fetching matching cards:', cardsError)
                return res.status(500).json({ error: 'Failed to search cards' })
            }

            // If no matches at all, still return unmatchedItems for UI
            if (!matchingCards || matchingCards.length === 0) {
                return res.json({
                    results: [],
                    searchSummary: {
                        totalBinders: 0,
                        totalCardsSearched: searchItems.length,
                        unmatchedItems: normalizedSearchList.map(({ name, qty }) => ({
                            name,
                            qty,
                        })),
                        searchItems,
                    },
                })
            }

            // Group results by binder and calculate matches
            const binderMatches = new Map() // binderId -> { binder, matchedCards Map<normName, {name, quantity}>, totalQuantity }

            for (const row of matchingCards) {
                const binderId = row.binder_id
                const cardName = row.cards.name

                // double-check using your fuzzy matcher
                const matchedSearch = searchItems.find((si) => cardNameMatches(cardName, si.name))
                if (!matchedSearch) continue

                if (!binderMatches.has(binderId)) {
                    binderMatches.set(binderId, {
                        binder: row.binders,
                        matchedCards: new Map(),
                        totalQuantity: 0,
                    })
                }

                const bucket = binderMatches.get(binderId)
                const key = normalizeCardName(cardName)

                if (!bucket.matchedCards.has(key)) {
                    bucket.matchedCards.set(key, { name: cardName, quantity: row.quantity })
                } else {
                    bucket.matchedCards.get(key).quantity += row.quantity
                }
                bucket.totalQuantity += row.quantity
            }

            // Global unmatched (not found in ANY binder)
            const globallyMatchedKeys = new Set()
            for (const [, bm] of binderMatches) {
                for (const k of bm.matchedCards.keys()) globallyMatchedKeys.add(k)
            }
            const unmatchedGlobal = normalizedSearchList
                .filter((si) => !globallyMatchedKeys.has(si.key))
                .map(({ name, qty }) => ({ name, qty }))

            // If no binder had any matches (e.g., matches blocked by filters), return empty results + unmatched
            if (binderMatches.size === 0) {
                return res.json({
                    results: [],
                    searchSummary: {
                        totalBinders: 0,
                        totalCardsSearched: searchItems.length,
                        unmatchedItems: unmatchedGlobal,
                        searchItems,
                    },
                })
            }

            // Fetch total card counts per binder
            const binderIds = Array.from(binderMatches.keys())
            const { data: binderCardCounts, error: countError } = await req.supabase
                .from('binder_cards')
                .select('binder_id, quantity')
                .in('binder_id', binderIds)
                .eq('listing_status', 'available')

            if (countError) {
                console.error('Error fetching binder card counts:', countError)
            }

            const binderTotalCounts = new Map()
            binderCardCounts?.forEach((row) => {
                const current = binderTotalCounts.get(row.binder_id) || 0
                binderTotalCounts.set(row.binder_id, current + row.quantity)
            })

            const results = Array.from(binderMatches.entries())
                .map(([binderId, bm]) => {
                    // per-binder missing items (from your list but not in this binder’s matches)
                    const missingItems = normalizedSearchList
                        .filter((si) => !bm.matchedCards.has(si.key))
                        .map(({ name, qty }) => ({ name, qty }))

                    const matchedItems = Array.from(bm.matchedCards.values()).map((x) => ({
                        name: x.name,
                        quantity: x.quantity,
                    }))

                    return {
                        id: bm.binder.id,
                        owner_id: bm.binder.owner_id,
                        name: bm.binder.name,
                        image_url: bm.binder.image_url,
                        privacy: bm.binder.privacy,
                        description: bm.binder.description,
                        totalCardsMatched: bm.matchedCards.size,
                        totalCardsSearched: searchItems.length,
                        cardCount: binderTotalCounts.get(binderId) || 0,
                        matchedItems, // <-- NEW (per binder)
                        missingItems, // <-- NEW (per binder)
                        owner: {
                            id: bm.binder.users.id,
                            username: bm.binder.users.username,
                            first_name: bm.binder.users.first_name,
                            last_name: bm.binder.users.last_name,
                            image_url: bm.binder.users.image_url,
                            isverified: bm.binder.users.isverified || false,
                            reputation: bm.binder.users.reputation || 0,
                            location: bm.binder.users.location,
                        },
                    }
                })
                .sort((a, b) => {
                    const aMatchPct = a.totalCardsMatched / a.totalCardsSearched
                    const bMatchPct = b.totalCardsMatched / b.totalCardsSearched
                    if (aMatchPct !== bMatchPct) return bMatchPct - aMatchPct
                    return b.totalCardsMatched - a.totalCardsMatched
                })

            res.json({
                results,
                searchSummary: {
                    totalBinders: results.length,
                    totalCardsSearched: searchItems.length,
                    unmatchedItems: unmatchedGlobal, // <-- NEW (global)
                    searchItems,
                },
            })
        } catch (error) {
            console.error('Bulk search error:', error)
            res.status(500).json({ error: 'Internal server error' })
        }
    })
)

// DELETE /api/binder-cards/:id  (owner only, blocked if reserved_quantity > 0)
router.delete(
    '/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
        const id = req.params.id
        const uid = req.user.id

        // fetch the binder_card
        const { data: bc, error: e1 } = await req.supabase
            .from('binder_cards')
            .select('id, binder_id, reserved_quantity')
            .eq('id', id)
            .maybeSingle()
        if (e1) return res.status(400).json({ error: e1.message })
        if (!bc) return res.status(404).json({ error: 'Not found' })

        // verify the user owns the parent binder
        const { data: binder, error: e2 } = await req.supabase
            .from('binders')
            .select('id, owner_id')
            .eq('id', bc.binder_id)
            .single()
        if (e2) return res.status(400).json({ error: e2.message })
        if (binder.owner_id !== uid) return res.status(403).json({ error: 'Not owner' })

        // block if there are reserved copies
        if ((bc.reserved_quantity ?? 0) > 0) {
            return res.status(409).json({ error: 'Cannot remove: reserved copies exist.' })
        }

        // delete
        const { error: delErr } = await req.supabase.from('binder_cards').delete().eq('id', id)
        if (delErr) return res.status(400).json({ error: delErr.message })

        res.json({ ok: true, id })
    })
)

// Keep generic CRUD (public read, owner CUD via RLS). Mount AFTER custom routes.
const crud = makeCrudRouter('binder_cards', { orderBy: 'created_at', publicRead: true })
router.use('/', crud)

export default router
