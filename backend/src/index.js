// src/index.js
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import helmet from 'helmet'
import morgan from 'morgan'

import { admin } from './lib/supabase/supabaseAdminClient.js'
import { attachSupabase } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

import usersRouter from './routes/users.routes.js'
import cardsRouter from './routes/cards.routes.js'
import bindersRouter from './routes/binders.routes.js'
import binderCardsRouter from './routes/binderCards.routes.js'
import cartsRouter from './routes/carts.routes.js'
import cartItemsRouter from './routes/cartItems.routes.js'
import offersRouter from './routes/offers.routes.js'
import offerItemsRouter from './routes/offerItems.routes.js'
import ordersRouter from './routes/orders.routes.js'
import orderItemsRouter from './routes/orderItems.routes.js'
import conversationsRouter from './routes/conversations.routes.js'
import conversationParticipantsRouter from './routes/conversationParticipants.routes.js'
import messagesRouter from './routes/messages.routes.js'
import notificationsRouter from './routes/notifications.routes.js'
import reviewsRouter from './routes/reviews.routes.js'
import tcgPricesRouter from './routes/tcgPrices.routes.js'
import { withSupabaseOptionalAuth } from './middleware/withSupabaseOptionalAuth.js'
import pricingRoutes from './routes/pricing.routes.js'
import chatRoutes from './routes/chat.routes.js'

import { startDailyPriceJobs } from './jobs/dailyPriceRefresh.js'

const app = express()
app.use(helmet())
app.use(express.json())
app.use(cors())
app.use(morgan('dev'))

// User-scoped Supabase client per request (respects RLS)
app.use(withSupabaseOptionalAuth)
app.use(attachSupabase)

// ----- Health-check endpoint -------------------------
app.get('/api/health', (req, res) => {
    if (admin) {
        res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: Date.now() })
    }
})

// ----- Other routes below here -------------------------
app.use('/api', chatRoutes)

app.use('/api/users', usersRouter)
app.use('/api/cards', cardsRouter)
app.use('/api/binders', bindersRouter)
app.use('/api/binder-cards', binderCardsRouter)
app.use('/api/carts', cartsRouter)
app.use('/api/cart-items', cartItemsRouter)
app.use('/api/offers', offersRouter)
app.use('/api/offer-items', offerItemsRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/order-items', orderItemsRouter)
app.use('/api/conversations', conversationsRouter)
app.use('/api/conversation-participants', conversationParticipantsRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/tcg-prices', tcgPricesRouter)
app.use('/api/pricing', pricingRoutes)

// Error-handling middleware (src/middleware/error.js) (always last)
app.use(errorHandler)

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`)
    startDailyPriceJobs()
})
