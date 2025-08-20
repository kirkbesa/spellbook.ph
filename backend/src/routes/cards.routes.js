import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('cards', { orderBy: 'created_at', publicRead: true })
