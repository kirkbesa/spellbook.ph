// backend/src/routes/pricing.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { repriceBinderCardsFromScryfall } from '../services/pricing_scryfall.js'

const router = express.Router()

router.post(
    '/binders/:id/reprice-scryfall',
    requireAuth,
    asyncHandler(async (req, res) => {
        const binderId = req.params.id
        const result = await repriceBinderCardsFromScryfall({ binderId })
        res.json({ ok: true, ...result })
    })
)

export default router
