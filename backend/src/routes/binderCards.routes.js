// backend/src/routes/binderCards.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { makeCrudRouter } from './_factory.js'

const router = express.Router()

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
