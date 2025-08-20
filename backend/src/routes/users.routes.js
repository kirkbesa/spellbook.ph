import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('users', { orderBy: 'created_at', publicRead: true })
