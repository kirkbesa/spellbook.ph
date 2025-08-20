export function errorHandler(err, _req, res, _next) {
    console.error(err)
    const code = err.status || 500
    res.status(code).json({ error: err.message || 'Internal Server Error' })
}
