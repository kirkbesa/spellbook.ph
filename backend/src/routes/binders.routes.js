import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('binders', { orderBy: 'created_at', publicRead: true })
