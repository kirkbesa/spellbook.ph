import { useState, useEffect, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabaseClient'
import { Spinner } from '@/components/common/Spinner'
import VerifiedBadge from '@/components/layout/VerifiedBadge'

type Props = {
    user_id: string
}

type Review = {
    id: string
    comment: string
    rating: number
    created_at: string
    reviewer: {
        id: string
        username: string
        first_name: string
        last_name: string
        image_url: string
        reputation: number
        isverified: boolean
    }
}

type ReviewsResponse = {
    data: Review[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
    }
    summary: {
        averageRating: number
        totalReviews: number
        ratingBreakdown: Record<1 | 2 | 3 | 4 | 5, number>
    }
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest'
type RatingFilter = 'all' | 1 | 2 | 3 | 4 | 5

const ITEMS_PER_PAGE = 10
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

const PublicReviews = ({ user_id }: Props) => {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [loadingMore, setLoadingMore] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)

    // Pagination & Filtering
    const [currentPage, setCurrentPage] = useState(1)
    const [pagination, setPagination] = useState<ReviewsResponse['pagination'] | null>(null)
    const [summary, setSummary] = useState<ReviewsResponse['summary'] | null>(null)
    const [sortBy, setSortBy] = useState<SortOption>('newest')
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
    const [showFilters, setShowFilters] = useState(false)

    // Input validation
    const validateUserId = (id: string): boolean => {
        return typeof id === 'string' && id.trim().length > 0 && id.trim().length <= 100
    }

    // Retry logic with exponential backoff
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    const fetchReviews = useCallback(
        async (
            userId: string,
            page = 1,
            sort: SortOption = 'newest',
            rating: RatingFilter = 'all',
            isRetry = false
        ) => {
            if (!validateUserId(userId)) {
                setError('Invalid user ID')
                setLoading(false)
                return
            }

            try {
                if (!isRetry) {
                    if (page === 1) {
                        setLoading(true)
                    } else {
                        setLoadingMore(true)
                    }
                    setError(null)
                }

                const { data: session } = await supabase.auth.getSession()
                const token = session.session?.access_token

                if (!token) {
                    throw new Error('Authentication required')
                }

                // Build query parameters
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: ITEMS_PER_PAGE.toString(),
                    sort,
                    ...(rating !== 'all' && { rating: rating.toString() }),
                })

                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE}/api/reviews/of-user/${userId.trim()}?${params}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        signal: AbortSignal.timeout(10000), // 10 second timeout
                    }
                )

                if (!response.ok) {
                    const errorData = await response
                        .json()
                        .catch(() => ({ error: 'Unknown error' }))
                    throw new Error(errorData.error || `HTTP ${response.status}`)
                }

                const result: ReviewsResponse = await response.json()

                if (page === 1) {
                    setReviews(result.data)
                } else {
                    setReviews((prev) => [...prev, ...result.data])
                }

                setPagination(result.pagination)
                setSummary(result.summary)
                setRetryCount(0) // Reset retry count on success
            } catch (error) {
                console.error('Error fetching reviews:', error)

                if (error instanceof Error) {
                    if (error.name === 'AbortError') {
                        setError('Request timed out. Please try again.')
                    } else if (error.message.includes('Authentication')) {
                        setError('Please log in to view reviews.')
                    } else if (retryCount < MAX_RETRIES && !isRetry) {
                        // Retry with exponential backoff
                        setRetryCount((prev) => prev + 1)
                        await delay(RETRY_DELAY * Math.pow(2, retryCount))
                        return fetchReviews(userId, page, sort, rating, true)
                    } else {
                        setError(error.message || 'Failed to load reviews. Please try again.')
                    }
                } else {
                    setError('An unexpected error occurred.')
                }
            } finally {
                setLoading(false)
                setLoadingMore(false)
            }
        },
        [retryCount]
    )

    // Initial load and when filters change
    useEffect(() => {
        setCurrentPage(1)
        fetchReviews(user_id, 1, sortBy, ratingFilter)
    }, [user_id, sortBy, ratingFilter, fetchReviews])

    // Load more reviews (pagination)
    const loadMoreReviews = () => {
        if (pagination?.hasNext && !loadingMore) {
            const nextPage = currentPage + 1
            setCurrentPage(nextPage)
            fetchReviews(user_id, nextPage, sortBy, ratingFilter)
        }
    }

    // Reset and refetch
    const handleRetry = () => {
        setRetryCount(0)
        setCurrentPage(1)
        fetchReviews(user_id, 1, sortBy, ratingFilter)
    }

    // Filter handlers
    const handleSortChange = (newSort: SortOption) => {
        setSortBy(newSort)
    }

    const handleRatingFilter = (rating: RatingFilter) => {
        setRatingFilter(rating)
    }

    const clearFilters = () => {
        setSortBy('newest')
        setRatingFilter('all')
    }

    // Render star rating display
    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, index) => (
            <Star
                key={index}
                className={`h-4 w-4 ${
                    index < rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                }`}
            />
        ))
    }

    // Render rating filter buttons
    const renderRatingFilters = () => {
        if (!summary) return null

        return (
            <div className='flex flex-wrap gap-2 mb-4'>
                <Button
                    variant={ratingFilter === 'all' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => handleRatingFilter('all')}
                >
                    All ({summary.totalReviews})
                </Button>
                {[5, 4, 3, 2, 1].map((rating) => (
                    <Button
                        key={rating}
                        variant={ratingFilter === rating ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => handleRatingFilter(rating as RatingFilter)}
                        className='flex items-center gap-1'
                    >
                        <Star className='h-3 w-3 text-yellow-500 fill-current' />
                        {rating} (
                        {summary.ratingBreakdown[rating as keyof typeof summary.ratingBreakdown] ||
                            0}
                        )
                    </Button>
                ))}
            </div>
        )
    }

    return (
        <div className='space-y-4'>
            {/* Header with summary */}
            <div className='flex items-center justify-between'>
                <div>
                    <h2 className='text-lg font-semibold'>User Reviews</h2>
                    {summary && (
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                            <div className='flex items-center gap-1'>
                                {renderStars(Math.round(summary.averageRating))}
                                <span className='font-medium'>
                                    {summary.averageRating.toFixed(1)}
                                </span>
                            </div>
                            <span>({summary.totalReviews} reviews)</span>
                        </div>
                    )}
                </div>
                <Button variant='outline' size='sm' onClick={() => setShowFilters(!showFilters)}>
                    <Filter className='h-4 w-4 mr-1' />
                    Filters
                </Button>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className='border rounded-lg p-4 bg-gray-50 space-y-4'>
                    {/* Sort options */}
                    <div>
                        <label className='text-sm font-medium mb-2 block'>Sort by:</label>
                        <div className='flex flex-wrap gap-2'>
                            {[
                                { value: 'newest', label: 'Newest first' },
                                { value: 'oldest', label: 'Oldest first' },
                                { value: 'highest', label: 'Highest rated' },
                                { value: 'lowest', label: 'Lowest rated' },
                            ].map((option) => (
                                <Button
                                    key={option.value}
                                    variant={sortBy === option.value ? 'default' : 'outline'}
                                    size='sm'
                                    onClick={() => handleSortChange(option.value as SortOption)}
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Rating filters */}
                    <div>
                        <label className='text-sm font-medium mb-2 block'>Filter by rating:</label>
                        {renderRatingFilters()}
                    </div>

                    {/* Clear filters */}
                    <Button variant='ghost' size='sm' onClick={clearFilters}>
                        Clear all filters
                    </Button>
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className='text-center py-8'>
                    <Spinner label='Loading reviews...' showLabel />
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className='text-center py-8'>
                    <p className='text-red-500 mb-4'>{error}</p>
                    <Button onClick={handleRetry} variant='outline'>
                        Try Again
                    </Button>
                </div>
            )}

            {/* Reviews list */}
            {!loading && !error && (
                <>
                    {reviews.length > 0 ? (
                        <div className='space-y-4'>
                            {reviews.map((review) => (
                                <div key={review.id} className='border rounded-lg p-4 bg-white'>
                                    <div className='flex items-start gap-3'>
                                        <img
                                            src={review.reviewer.image_url}
                                            alt={`${review.reviewer.first_name} ${review.reviewer.last_name}`}
                                            className='w-10 h-10 rounded-full object-cover'
                                            onError={(e) => {
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.reviewer.first_name + ' ' + review.reviewer.last_name)}&background=random`
                                            }}
                                        />
                                        <div className='flex-1'>
                                            <div className='flex items-center justify-between'>
                                                <div className='flex gap-4'>
                                                    <span className='font-semibold text-gray-900'>
                                                        {review.reviewer.first_name
                                                            ? review.reviewer.first_name +
                                                              ' ' +
                                                              review.reviewer.last_name
                                                            : '@' + review.reviewer.username}
                                                    </span>
                                                    <div className='flex'>
                                                        {review.reviewer.isverified && (
                                                            <VerifiedBadge
                                                                isVerified={
                                                                    review.reviewer.isverified
                                                                }
                                                            />
                                                        )}
                                                        {review.reviewer.reputation >= 0 && (
                                                            <Badge
                                                                variant='secondary'
                                                                className='ml-2 text-xs'
                                                            >
                                                                <Star />{' '}
                                                                {review.reviewer.reputation} rep
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <time className='text-xs text-gray-500'>
                                                    {new Date(review.created_at).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                        }
                                                    )}
                                                </time>
                                            </div>
                                            <div className='flex items-center mt-1'>
                                                {renderStars(review.rating)}
                                            </div>
                                            <p className='mt-2 text-gray-700 text-sm leading-relaxed'>
                                                {review.comment}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Load More button */}
                            {pagination?.hasNext && (
                                <div className='text-center pt-4'>
                                    <Button
                                        onClick={loadMoreReviews}
                                        disabled={loadingMore}
                                        variant='outline'
                                    >
                                        {loadingMore ? (
                                            <>
                                                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2'></div>
                                                Loading more...
                                            </>
                                        ) : (
                                            <>
                                                Load More Reviews
                                                {pagination.totalPages > pagination.page && (
                                                    <span className='ml-1 text-gray-500'>
                                                        ({pagination.total - reviews.length}{' '}
                                                        remaining)
                                                    </span>
                                                )}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Pagination info */}
                            {pagination && (
                                <div className='text-center text-sm text-gray-500 pt-2'>
                                    Showing {reviews.length} of {pagination.total} reviews
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className='text-center py-12'>
                            <Star className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                            <p className='text-gray-500'>No reviews yet.</p>
                            {ratingFilter !== 'all' && (
                                <Button
                                    variant='link'
                                    onClick={() => handleRatingFilter('all')}
                                    className='mt-2'
                                >
                                    Show all reviews
                                </Button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default PublicReviews
