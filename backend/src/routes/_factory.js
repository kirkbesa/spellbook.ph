import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { createCrud } from '../controllers/crudFactory.js'

/**
 * Build a CRUD router for a table quickly.
 * opts: { orderBy?: string, idColumn?: string, publicRead?: boolean }
 */
export function makeCrudRouter(table, opts = {}) {
    const r = express.Router()
    const ctrl = createCrud(table, opts)

    // Public read (no auth), or protect GET with auth
    if (opts.publicRead) {
        r.get('/', asyncHandler(ctrl.list))
        r.get('/:id', asyncHandler(ctrl.get))
    } else {
        r.get('/', requireAuth, asyncHandler(ctrl.list))
        r.get('/:id', requireAuth, asyncHandler(ctrl.get))
    }

    // Writes always require auth
    r.post('/', requireAuth, asyncHandler(ctrl.create))
    r.patch('/:id', requireAuth, asyncHandler(ctrl.update))
    r.delete('/:id', requireAuth, asyncHandler(ctrl.remove))

    return r
}
