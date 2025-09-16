import express from 'express'
import asyncHandler from '../middleware/asyncHandler.js'
import { makeCrudRouter } from './_factory.js'
import { admin } from '../lib/supabase/supabaseAdminClient.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Validation helpers
const validatePagination = (page, limit) => {
    const parsedPage = parseInt(page) || 1
    const parsedLimit = Math.min(parseInt(limit) || 10, 50) // Max 50 per page
    return {
        page: Math.max(1, parsedPage),
        limit: Math.max(1, parsedLimit),
        offset: (Math.max(1, parsedPage) - 1) * Math.max(1, parsedLimit),
    }
}

const validateSort = (sort) => {
    const validSorts = {
        newest: { column: 'created_at', ascending: false },
        oldest: { column: 'created_at', ascending: true },
        highest: { column: 'rating', ascending: false },
        lowest: { column: 'rating', ascending: true },
    }
    return validSorts[sort] || validSorts['newest']
}

const validateRating = (rating) => {
    const parsed = parseInt(rating)
    return parsed >= 1 && parsed <= 5 ? parsed : null
}

// Get Reviews of User with pagination, filtering, and sorting
router.get(
    '/of-user/:id',
    requireAuth,
    asyncHandler(async (req, res) => {
        const user_id = req.params.id
        const { page, limit, sort, rating } = req.query

        // Validate user_id
        if (!user_id || typeof user_id !== 'string' || user_id.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid user ID provided',
            })
        }

        // Validate and parse query parameters
        const pagination = validatePagination(page, limit)
        const sortConfig = validateSort(sort)
        const ratingFilter = validateRating(rating)

        try {
            // Build base query
            let reviewsQuery = admin
                .from('reviews')
                .select(
                    `id, 
                    comment, 
                    rating, 
                    created_at,
                    reviewer: reviewer_id (id, username, first_name, last_name, image_url, reputation, isverified)`,
                    { count: 'exact' } // Get total count
                )
                .eq('reviewee_id', user_id.trim())

            // Apply rating filter if provided
            if (ratingFilter) {
                reviewsQuery = reviewsQuery.eq('rating', ratingFilter)
            }

            // Apply sorting
            reviewsQuery = reviewsQuery.order(sortConfig.column, {
                ascending: sortConfig.ascending,
            })

            // Apply pagination
            reviewsQuery = reviewsQuery.range(
                pagination.offset,
                pagination.offset + pagination.limit - 1
            )

            const { data: reviews, error, count } = await reviewsQuery

            if (error) {
                console.error('Error fetching reviews:', error)
                return res.status(400).json({ error: error.message })
            }

            // Get summary statistics (always fetch without filters for accurate summary)
            const { data: allReviews, error: summaryError } = await admin
                .from('reviews')
                .select('rating')
                .eq('reviewee_id', user_id.trim())

            if (summaryError) {
                console.error('Error fetching review summary:', summaryError)
                return res.status(400).json({ error: summaryError.message })
            }

            // Calculate summary statistics
            const totalReviews = allReviews?.length || 0
            const averageRating =
                totalReviews > 0
                    ? allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
                    : 0

            // Calculate rating breakdown
            const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            allReviews?.forEach((review) => {
                if (review.rating >= 1 && review.rating <= 5) {
                    ratingBreakdown[review.rating]++
                }
            })

            // Calculate pagination metadata
            const totalPages = Math.ceil((count || 0) / pagination.limit)
            const hasNext = pagination.page < totalPages
            const hasPrev = pagination.page > 1

            // Format response
            const response = {
                data: reviews || [],
                pagination: {
                    page: pagination.page,
                    limit: pagination.limit,
                    total: count || 0,
                    totalPages,
                    hasNext,
                    hasPrev,
                },
                summary: {
                    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
                    totalReviews,
                    ratingBreakdown,
                },
                filters: {
                    sort: sort || 'newest',
                    rating: ratingFilter || 'all',
                },
            }

            res.json(response)
        } catch (error) {
            console.error('Error fetching reviews for user:', error)
            res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            })
        }
    })
)

// Get review summary only (lightweight endpoint for quick stats)
router.get(
    '/of-user/:id/summary',
    requireAuth,
    asyncHandler(async (req, res) => {
        const user_id = req.params.id

        if (!user_id || typeof user_id !== 'string' || user_id.trim().length === 0) {
            return res.status(400).json({ error: 'Invalid user ID provided' })
        }

        try {
            const { data: reviews, error } = await admin
                .from('reviews')
                .select('rating')
                .eq('reviewee_id', user_id.trim())

            if (error) {
                console.error('Error fetching review summary:', error)
                return res.status(400).json({ error: error.message })
            }

            const totalReviews = reviews?.length || 0
            const averageRating =
                totalReviews > 0
                    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
                    : 0

            const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            reviews?.forEach((review) => {
                if (review.rating >= 1 && review.rating <= 5) {
                    ratingBreakdown[review.rating]++
                }
            })

            res.json({
                averageRating: Math.round(averageRating * 10) / 10,
                totalReviews,
                ratingBreakdown,
            })
        } catch (error) {
            console.error('Error fetching review summary:', error)
            res.status(500).json({
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : undefined,
            })
        }
    })
)

// Auth-protected CRUD for full rows
const crud = makeCrudRouter('reviews', { orderBy: 'created_at', publicRead: false })
router.use('/', crud)

export default router
