// backend/src/routes/conversations.routes.js
import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('conversations', { orderBy: 'created_at' })
