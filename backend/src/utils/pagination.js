export function parsePagination(query) {
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 200)
    const page = Math.max(parseInt(query.page, 10) || 1, 1)
    const offset = (page - 1) * limit
    return { limit, page, offset }
}
