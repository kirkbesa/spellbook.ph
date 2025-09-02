// backend/src/routes/chat.routes.js
import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'

const r = express.Router()

/**
 * GET /api/conversations/mine
 * Returns the current user's conversations with participants (username, image) and last message info.
 */
r.get(
    '/conversations/mine',
    requireAuth,
    asyncHandler(async (req, res) => {
        const me = req.user.id
        // conversations where I am a participant
        const { data: convs, error } = await req.supabase
            .from('conversations')
            .select(
                `
        id,
        last_message_at,
        last_message_id,
        conversation_participants:conversation_participants (
          user_id,
          users: user_id ( username, image_url )
        )
      `
            )
            .order('last_message_at', { ascending: false })
            .in(
                'id',
                // subquery: all conv ids I'm part of
                (
                    await req.supabase
                        .from('conversation_participants')
                        .select('conversation_id')
                        .eq('user_id', me)
                ).data?.map((x) => x.conversation_id) ?? []
            )

        if (error) return res.status(400).json({ error: error.message })

        // optional: fetch a 1-line preview for each last_message_id (single round trip)
        const lastIds = (convs ?? []).map((c) => c.last_message_id).filter(Boolean)

        let previews = new Map()
        if (lastIds.length) {
            const { data: msgs } = await req.supabase
                .from('messages')
                .select('id, content')
                .in('id', lastIds)
            for (const m of msgs ?? []) previews.set(m.id, m.content ?? null)
        }

        const payload = (convs ?? []).map((c) => ({
            id: c.id,
            last_message_at: c.last_message_at,
            last_message_id: c.last_message_id,
            last_message_preview: c.last_message_id
                ? (previews.get(c.last_message_id) ?? null)
                : null,
            participants: (c.conversation_participants ?? []).map((p) => {
                const u = Array.isArray(p.users) ? p.users[0] : p.users
                return {
                    user_id: p.user_id,
                    username: u?.username ?? null,
                    image_url: u?.image_url ?? null,
                }
            }),
        }))

        res.json({ data: payload })
    })
)

/**
 * GET /api/conversations/:id/participants
 * Returns participants for a conversation with user public fields.
 */
r.get(
    '/conversations/:id/participants',
    requireAuth,
    asyncHandler(async (req, res) => {
        const conversationId = req.params.id
        const { data, error } = await req.supabase
            .from('conversation_participants')
            .select(
                `
        conversation_id,
        user_id,
        last_read_message_id,
        last_read_at,
        users: user_id ( username, image_url )
      `
            )
            .eq('conversation_id', conversationId)

        if (error) return res.status(400).json({ error: error.message })

        const parts = (data ?? []).map((row) => {
            const u = Array.isArray(row.users) ? row.users[0] : row.users
            return {
                conversation_id: row.conversation_id,
                user_id: row.user_id,
                last_read_message_id: row.last_read_message_id,
                last_read_at: row.last_read_at,
                users: { username: u?.username ?? null, image_url: u?.image_url ?? null },
            }
        })

        res.json({ data: parts })
    })
)

/**
 * GET /api/conversations/:id/messages
 * Returns messages for a conversation (ascending by created_at).
 * Optional query: ?before=<iso|timestamp>&limit=50 for pagination (kept simple).
 */
r.get(
    '/conversations/:id/messages',
    requireAuth,
    asyncHandler(async (req, res) => {
        const { id } = req.params
        const limit = Number(req.query.limit ?? 50)
        const beforeId = req.query.beforeId ? Number(req.query.beforeId) : undefined

        let q = req.supabase
            .from('messages')
            .select('id, conversation_id, sender_id, content, created_at')
            .eq('conversation_id', id)
            .order('id', { ascending: false }) // newest first

        if (beforeId) q = q.lt('id', beforeId)

        q = q.limit(limit)

        const { data, error } = await q
        if (error) return res.status(400).json({ error: error.message })
        // returns newest->oldest; frontend can reverse for display
        res.json({ data })
    })
)

/**
 * POST /api/conversations/:id/messages
 * Body: { content: string }
 * Inserts a message from current user, bumps conversation last_message_* fields.
 */
r.post(
    '/conversations/:id/messages',
    requireAuth,
    asyncHandler(async (req, res) => {
        const { id } = req.params
        const senderId = req.user.id
        const { content } = req.body

        const { data: msg, error: e1 } = await req.supabase
            .from('messages')
            .insert({ conversation_id: id, sender_id: senderId, content })
            .select('id, created_at, content, sender_id, conversation_id')
            .single()
        if (e1) return res.status(400).json({ error: e1.message })

        // bump conversation
        const { error: e2 } = await req.supabase
            .from('conversations')
            .update({ last_message_at: msg.created_at, last_message_id: msg.id })
            .eq('id', id)
        if (e2) return res.status(400).json({ error: e2.message })

        res.status(201).json({ data: msg })
    })
)

/**
 * POST /api/conversations/:id/mark-read
 * Body: { latestMessageId?: number }
 * Sets last_read_message_id / last_read_at for the current user.
 * Also marks notifications of type 'message' for this conversation as read for this user.
 */
r.post(
    '/conversations/:id/mark-read',
    requireAuth,
    asyncHandler(async (req, res) => {
        const { id } = req.params
        const me = req.user.id
        let { latestMessageId } = req.body || {}

        // if missing, compute latest message id
        if (!latestMessageId) {
            const { data: last } = await req.supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', id)
                .order('id', { ascending: false })
                .limit(1)
                .maybeSingle()
            if (last?.id) latestMessageId = last.id
        }

        const now = new Date().toISOString()

        const { error: e1 } = await req.supabase
            .from('conversation_participants')
            .update({ last_read_message_id: latestMessageId ?? null, last_read_at: now })
            .eq('conversation_id', id)
            .eq('user_id', me)
        if (e1) return res.status(400).json({ error: e1.message })

        const { error: e2 } = await req.supabase
            .from('notifications')
            .update({ read_at: now })
            .eq('user_id', me)
            .eq('type', 'message')
            .eq('conversation_id', id)
            .is('read_at', null)
        if (e2) return res.status(400).json({ error: e2.message })

        res.json({ ok: true, last_read_message_id: latestMessageId ?? null })
    })
)

/**
 * POST /api/conversations/start-by-username
 * Body: { username: string }
 * Finds user by username (case-insensitive), ensures/creates a 1:1 conversation, returns { id }.
 */
r.post(
    '/conversations/start-by-username',
    requireAuth,
    asyncHandler(async (req, res) => {
        const me = req.user.id
        const { username } = req.body
        if (!username) return res.status(400).json({ error: 'username is required' })

        // find target user (case-insensitive)
        const { data: peer, error: e1 } = await req.supabase
            .from('users')
            .select('id, username')
            .ilike('username', username)
            .limit(1)
            .maybeSingle()
        if (e1) return res.status(400).json({ error: e1.message })
        if (!peer) return res.status(404).json({ error: 'User not found' })
        if (peer.id === me) return res.status(400).json({ error: 'Cannot chat with yourself' })

        // find existing DM (is_dm = true) that includes both users
        const { data: existing } = await req.supabase
            .from('conversations')
            .select('id')
            .eq('is_dm', true)
            .in(
                'id',
                (
                    await req.supabase
                        .from('conversation_participants')
                        .select('conversation_id')
                        .or(`user_id.eq.${me},user_id.eq.${peer.id}`)
                ).data
                    ?.map((x) => x.conversation_id)
                    // keep only ids that appear twice (both users present)
                    .filter((id, _, arr) => arr.filter((y) => y === id).length >= 2) ?? []
            )
            .limit(1)
            .maybeSingle()

        if (existing?.id) return res.json({ id: existing.id })

        // create DM conversation + participants
        const { data: conv, error: e2 } = await req.supabase
            .from('conversations')
            .insert({ is_dm: true })
            .select('id')
            .single()
        if (e2) return res.status(400).json({ error: e2.message })

        const { error: e3 } = await req.supabase.from('conversation_participants').insert([
            { conversation_id: conv.id, user_id: me },
            { conversation_id: conv.id, user_id: peer.id },
        ])
        if (e3) return res.status(400).json({ error: e3.message })

        res.status(201).json({ id: conv.id })
    })
)

export default r
