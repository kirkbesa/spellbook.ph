// backend/src/routes/binders.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { makeCrudRouter } from './_factory.js'

const router = express.Router()

router.get(
    '/mine',
    requireAuth,
    asyncHandler(async (req, res) => {
        const uid = req.user.id
        const { data: binders, error } = await req.supabase
            .from('binders')
            .select('id, owner_id, name, color_hex, pocket_layout, privacy, created_at, updated_at')
            .eq('owner_id', uid)
            .order('created_at', { ascending: false })
        if (error) return res.status(400).json({ error: error.message })

        const ids = (binders ?? []).map((b) => b.id)
        if (!ids.length) return res.json({ data: [] })

        const { data: items, error: e2 } = await req.supabase
            .from('binder_cards')
            .select('binder_id, quantity')
            .in('binder_id', ids)
        if (e2) return res.status(400).json({ error: e2.message })

        const counts = new Map()
        for (const it of items ?? [])
            counts.set(it.binder_id, (counts.get(it.binder_id) ?? 0) + Number(it.quantity ?? 0))
        res.json({ data: binders.map((b) => ({ ...b, card_count: counts.get(b.id) ?? 0 })) })
    })
)

// PUBLIC: list a user's public binders (anon allowed; RLS hides private)
router.get(
    '/by-user/:id',
    asyncHandler(async (req, res) => {
        const userId = req.params.id
        const { data: binders, error } = await req.supabase
            .from('binders')
            .select('id, owner_id, name, color_hex, pocket_layout, privacy, created_at, updated_at')
            .eq('owner_id', userId)
            .order('created_at', { ascending: false })
        if (error) return res.status(400).json({ error: error.message })

        const ids = (binders ?? []).map((b) => b.id)
        if (!ids.length) return res.json({ data: [] })

        const { data: items, error: e2 } = await req.supabase
            .from('binder_cards')
            .select('binder_id, quantity')
            .in('binder_id', ids)
        if (e2) return res.status(400).json({ error: e2.message })

        const counts = new Map()
        for (const it of items ?? [])
            counts.set(it.binder_id, (counts.get(it.binder_id) ?? 0) + Number(it.quantity ?? 0))
        res.json({ data: binders.map((b) => ({ ...b, card_count: counts.get(b.id) ?? 0 })) })
    })
)

// Reads public, writes auth
const crud = makeCrudRouter('binders', { orderBy: 'created_at', publicRead: true })
router.use('/', crud)

export default router
