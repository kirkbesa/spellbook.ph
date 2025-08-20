import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('messages', { orderBy: 'created_at' })
