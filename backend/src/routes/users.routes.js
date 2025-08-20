// backend/src/routes/users.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { makeCrudRouter } from './_factory.js'
import { admin } from '../lib/supabase/supabaseAdminClient.js'

const router = express.Router()

// PUBLIC: check username (must be before '/:id')
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

// PUBLIC: minimal public profile by user id (safe fields only)
router.get(
    '/public/:id',
    asyncHandler(async (req, res) => {
        const { id } = req.params

        const { data, error } = await admin
            .from('users')
            .select('id, username, first_name, last_name, location, image_url')
            .eq('id', id)
            .maybeSingle()

        if (error) return res.status(400).json({ error: error.message })
        if (!data) return res.status(404).json({ error: 'Not found' })

        // Optional: short cache to reduce load
        res.set('Cache-Control', 'public, max-age=60')
        res.json({ data })
    })
)

// Auth-protected CRUD for full rows
const crud = makeCrudRouter('users', { orderBy: 'created_at', publicRead: false })
router.use('/', crud)

export default router
