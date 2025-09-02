// backend/src/routes/messages.routes.js
import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('messages', { orderBy: 'created_at' })
