// backend/src/routes/users.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { makeCrudRouter } from './_factory.js'
import { admin } from '../lib/supabase/supabaseAdminClient.js'

const router = express.Router()

// PUBLIC endpoint must be registered before '/:id'
router.get(
    '/check-username',
    asyncHandler(async (req, res) => {
        const raw = String(req.query.u ?? '').trim()
        const valid = /^[a-zA-Z0-9_]{3,24}$/.test(raw)
        if (!valid) return res.json({ available: false, reason: 'invalid' })

        const { data, error } = await admin.rpc('username_available', { u: raw })
        if (error) return res.status(400).json({ available: false, error: error.message })
        res.json({ available: !!data })
    })
)

const crud = makeCrudRouter('users', { orderBy: 'created_at', publicRead: false })
router.use('/', crud)

export default router
