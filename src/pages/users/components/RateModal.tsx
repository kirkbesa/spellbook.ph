import { useState, useEffect } from 'react'
import { Loader2, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'

type Props = {
    reviewer_id: string
    reviewee_id: string
    setOpen: (isOpen: boolean) => void
}

// Validation constants
const VALIDATION_RULES = {
    comment: {
        minLength: 10,
        maxLength: 1000,
    },
    rating: {
        min: 1,
        max: 5,
    },
} as const

// Validation functions
const validateUserId = (id: string): boolean => {
    return typeof id === 'string' && id.trim().length > 0 && id.trim().length <= 100
}

const validateRating = (rating: number | null): boolean => {
    return (
        rating !== null &&
        Number.isInteger(rating) &&
        rating >= VALIDATION_RULES.rating.min &&
        rating <= VALIDATION_RULES.rating.max
    )
}

const validateComment = (comment: string): { isValid: boolean; error?: string } => {
    const trimmed = comment.trim()

    if (trimmed.length === 0) {
        return { isValid: false, error: 'Comment is required' }
    }

    if (trimmed.length < VALIDATION_RULES.comment.minLength) {
        return {
            isValid: false,
            error: `Comment must be at least ${VALIDATION_RULES.comment.minLength} characters`,
        }
    }

    if (trimmed.length > VALIDATION_RULES.comment.maxLength) {
        return {
            isValid: false,
            error: `Comment must not exceed ${VALIDATION_RULES.comment.maxLength} characters`,
        }
    }

    return { isValid: true }
}

const RateModal = ({ reviewer_id, reviewee_id, setOpen }: Props) => {
    const [rating, setRating] = useState<number | null>(null)
    const [hoverRating, setHoverRating] = useState<number | null>(null)
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<{
        rating?: string
        comment?: string
        general?: string
    }>({})

    // Validate props on mount
    useEffect(() => {
        const propErrors: { general?: string } = {}

        if (!validateUserId(reviewer_id)) {
            propErrors.general = 'Invalid reviewer ID'
        }

        if (!validateUserId(reviewee_id)) {
            propErrors.general = 'Invalid reviewee ID'
        }

        if (reviewer_id === reviewee_id) {
            propErrors.general = 'Cannot review yourself'
        }

        if (typeof setOpen !== 'function') {
            propErrors.general = 'Invalid setOpen function'
        }

        if (Object.keys(propErrors).length > 0) {
            setErrors(propErrors)
        }
    }, [reviewer_id, reviewee_id, setOpen])

    const clearErrors = () => {
        setErrors({})
    }

    const validateForm = (): boolean => {
        clearErrors()
        const newErrors: typeof errors = {}

        // Validate rating
        if (!validateRating(rating)) {
            newErrors.rating = 'Please select a rating'
        }

        // Validate comment
        const commentValidation = validateComment(comment)
        if (!commentValidation.isValid) {
            newErrors.comment = commentValidation.error
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return false
        }

        return true
    }

    const handleSubmit = async () => {
        // Early return if already loading or has prop errors
        if (loading || errors.general) {
            return
        }

        // Validate form
        if (!validateForm()) {
            return
        }

        setLoading(true)
        clearErrors()

        try {
            const payload = {
                reviewer_id: reviewer_id.trim(),
                reviewee_id: reviewee_id.trim(),
                rating: rating!,
                comment: comment.trim(),
            }

            const { data: session } = await supabase.auth.getSession()
            const token = session.session?.access_token
            if (!token) throw new Error('Not authenticated')

            const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error || `Failed to create binder (${res.status})`)
            }

            // Success - close modal
            toast.success('Review Submitted!')
            setOpen(false)
        } catch (error) {
            console.error('Error submitting review:', error)
            setErrors({
                general:
                    error instanceof Error
                        ? error.message
                        : 'Failed to submit review. Please try again.',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleStarClick = (value: number) => {
        if (loading || errors.general) return

        if (validateRating(value)) {
            setRating(value)
            // Clear rating error if it exists
            if (errors.rating) {
                setErrors((prev) => ({ ...prev, rating: undefined }))
            }
        }
    }

    const handleStarHover = (value: number) => {
        if (loading || errors.general) return
        if (validateRating(value)) {
            setHoverRating(value)
        }
    }

    const handleStarLeave = () => {
        if (loading || errors.general) return
        setHoverRating(null)
    }

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (loading || errors.general) return

        const value = e.target.value
        setComment(value)

        // Clear comment error if it exists and user is typing
        if (errors.comment && value.trim().length > 0) {
            setErrors((prev) => ({ ...prev, comment: undefined }))
        }
    }

    const handleCancel = () => {
        if (loading) return
        setOpen(false)
    }

    // Don't render if there are critical prop errors
    if (errors.general) {
        return (
            <Dialog open onOpenChange={() => setOpen(false)}>
                <DialogContent className='max-w-lg p-6'>
                    <DialogHeader>
                        <DialogTitle>Error</DialogTitle>
                    </DialogHeader>
                    <p className='text-red-600'>{errors.general}</p>
                    <div className='flex justify-end pt-4'>
                        <Button onClick={() => setOpen(false)}>Close</Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const isFormValid = validateRating(rating) && validateComment(comment).isValid

    return (
        <Dialog open onOpenChange={() => setOpen(false)}>
            <DialogContent className='max-w-lg p-6'>
                <DialogHeader>
                    <DialogTitle>Rate User</DialogTitle>
                </DialogHeader>

                {/* Rating stars */}
                <div className=''>
                    <div className='flex gap-2'>
                        {[1, 2, 3, 4, 5].map((value) => (
                            <Star
                                key={value}
                                size={24}
                                className={`cursor-pointer transition-colors ${
                                    (hoverRating || rating || 0) >= value
                                        ? 'text-amber-500'
                                        : 'text-gray-300'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleStarClick(value)}
                                onMouseEnter={() => handleStarHover(value)}
                                onMouseLeave={handleStarLeave}
                                aria-label={`Rate ${value} star${value !== 1 ? 's' : ''}`}
                            />
                        ))}
                    </div>
                    {errors.rating && <p className='text-red-600 text-sm'>{errors.rating}</p>}
                </div>

                {/* Comment section */}
                <div className='mb-4'>
                    <Textarea
                        rows={4}
                        value={comment}
                        onChange={handleCommentChange}
                        placeholder='Leave a comment (minimum 10 characters)'
                        className={`text-sm sm:text-md ${errors.comment ? 'border-red-500' : ''}`}
                        disabled={loading}
                        maxLength={VALIDATION_RULES.comment.maxLength}
                        aria-describedby={errors.comment ? 'comment-error' : undefined}
                    />
                    <div className='flex justify-between items-center mt-1'>
                        <div>
                            {errors.comment && (
                                <p id='comment-error' className='text-red-600 text-sm'>
                                    {errors.comment}
                                </p>
                            )}
                        </div>
                        <p className='text-gray-500 text-xs'>
                            {comment.length}/{VALIDATION_RULES.comment.maxLength}
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className='flex justify-end gap-2 pt-4'>
                    <Button variant='ghost' onClick={handleCancel} disabled={loading} type='button'>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading || !isFormValid} type='button'>
                        {loading ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Submitting...
                            </>
                        ) : (
                            'Submit Review'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default RateModal
