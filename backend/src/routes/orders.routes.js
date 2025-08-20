import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('orders', { orderBy: 'created_at' })
