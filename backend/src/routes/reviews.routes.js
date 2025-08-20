import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('reviews', { orderBy: 'created_at', publicRead: true })
