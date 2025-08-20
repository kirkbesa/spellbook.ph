import { makeCrudRouter } from './_factory.js'
export default makeCrudRouter('tcg_prices', { orderBy: 'captured_at', publicRead: true })
