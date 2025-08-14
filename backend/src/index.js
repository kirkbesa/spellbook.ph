// src/index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import errorHandler from './middleware/error.js'
import { supabaseAdmin } from './lib/supabase/supabaseAdminClient.js'

dotenv.config()

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(cors())

// ----- Health-check endpoint -------------------------
app.get('/api/health', (req, res) => {
    if (supabaseAdmin) {
        res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: Date.now() })
    }
})

// ----- Other routes below here -------------------------

// Error-handling middleware (src/middleware/error.js) (always last)
app.use(errorHandler)

app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`)
})
