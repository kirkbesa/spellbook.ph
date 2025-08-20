import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'

const r = express.Router()

// List (optionally filter by conversation_id)
r.get(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
        const q = req.query.conversation_id
        let query = req.supabase.from('conversation_participants').select('*')
        if (q) query = query.eq('conversation_id', q)
        const { data, error } = await query
        if (error) return res.status(400).json({ error: error.message })
        res.json({ data })
    })
)

// Get one (composite PK)
r.get(
    '/:conversationId/:userId',
    requireAuth,
    asyncHandler(async (req, res) => {
        const { conversationId, userId } = req.params
        const { data, error } = await req.supabase
            .from('conversation_participants')
            .select('*')
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .single()
        if (error) return res.status(404).json({ error: error.message })
        res.json({ data })
    })
)

// Create
r.post(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
        const payload = req.body
        const { data, error } = await req.supabase
            .from('conversation_participants')
            .insert([payload])
            .select()
            .single()
        if (error) return res.status(400).json({ error: error.message })
        res.status(201).json({ data })
    })
)

// Delete
r.delete(
    '/:conversationId/:userId',
    requireAuth,
    asyncHandler(async (req, res) => {
        const { conversationId, userId } = req.params
        const { data, error } = await req.supabase
            .from('conversation_participants')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId)
            .select()
            .single()
        if (error) return res.status(400).json({ error: error.message })
        res.json({ data })
    })
)

export default r
