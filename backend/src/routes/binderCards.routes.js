import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('binder_cards', { orderBy: 'created_at', publicRead: true })
