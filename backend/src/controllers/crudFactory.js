import { parsePagination } from '../utils/pagination.js'

/**
 * Generic CRUD handlers using req.supabase (RLS-aware)
 * Options:
 *   - orderBy?: string    (default: none)
 *   - idColumn?: string   (default: 'id')
 */
export function createCrud(table, opts = {}) {
    const idCol = opts.idColumn || 'id'
    const defaultOrderBy = opts.orderBy || null

    return {
        list: async (req, res) => {
            const { limit, offset } = parsePagination(req.query)
            let q = req.supabase.from(table).select('*', { count: 'exact' })
            if (defaultOrderBy) q = q.order(defaultOrderBy, { ascending: false })
            const { data, error, count } = await q.range(offset, offset + limit - 1)
            if (error) return res.status(400).json({ error: error.message })
            res.json({ data, count, pageSize: limit, page: Math.floor(offset / limit) + 1 })
        },

        get: async (req, res) => {
            const id = req.params.id
            const { data, error } = await req.supabase
                .from(table)
                .select('*')
                .eq(idCol, id)
                .single()
            if (error) return res.status(404).json({ error: error.message })
            res.json({ data })
        },

        create: async (req, res) => {
            const payload = req.body
            const { data, error } = await req.supabase
                .from(table)
                .insert([payload])
                .select()
                .single()
            if (error) return res.status(400).json({ error: error.message })
            res.status(201).json({ data })
        },

        update: async (req, res) => {
            const id = req.params.id
            const payload = req.body
            const { data, error } = await req.supabase
                .from(table)
                .update(payload)
                .eq(idCol, id)
                .select()
                .single()
            if (error) return res.status(400).json({ error: error.message })
            res.json({ data })
        },

        remove: async (req, res) => {
            const id = req.params.id
            const { data, error } = await req.supabase
                .from(table)
                .delete()
                .eq(idCol, id)
                .select()
                .single()
            if (error) return res.status(400).json({ error: error.message })
            res.json({ data })
        },
    }
}
