import { useState, useEffect } from 'react'
import LatestBinderTile from './LatestBinderTile'
import { BinderSkeleton } from '@/components/layout/BinderLoading'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

// Define the types for the associated entities

// Type for Owner details
type Owner = {
    id: string
    username: string
    first_name: string | null
    last_name: string | null
    image_url: string | null
    isverified: boolean
    reputation: number
    location: string | null
}

// Type for BinderCard information
type BinderCard = {
    binder_id: string
    updated_at: string
}

// Type for the Binder itself
export type Binder = {
    id: string
    name: string
    image_url: string | null
    privacy: 'public' | 'unlisted' | 'private' // Enum values
    description: string | null
    owner_id: string
    created_at: string
    updated_at: string
    users: Owner
    binder_cards: BinderCard[]
    card_count: number
}

// Type for the API Response
export type LatestBindersResponse = {
    data: Binder[]
}

const LatestBinders = () => {
    const [newlyCreatedBinders, setNewlyCreatedBinders] = useState<Binder[]>([])
    const [bindersWithNewCards, setBindersWithNewCards] = useState<Binder[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    const fetchBinders = async (filterBy: string) => {
        setLoading(true)
        try {
            const response = await fetch(
                `${API_BASE}/api/binders/latest?filterBy=${filterBy}&limit=6`
            )
            const result = await response.json()

            if (filterBy === 'newly_created') {
                setNewlyCreatedBinders(result.data)
            } else if (filterBy === 'with_new_cards') {
                setBindersWithNewCards(result.data)
            }
        } catch (error) {
            console.error('Error fetching binders:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBinders('newly_created')
        fetchBinders('with_new_cards')
    }, [])

    return (
        <div className='mx-auto max-w-6xl space-y-4'>
            <h1 className='text-2xl font-bold'>Latest Binders</h1>

            {/* Newly Created Binders Section */}
            {newlyCreatedBinders.length > 0 && (
                <div className='space-y-2'>
                    <h2 className='text-lg font-semibold'>
                        Newly Created Binders ({newlyCreatedBinders.length})
                    </h2>
                    {loading ? (
                        <BinderSkeleton />
                    ) : (
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            {newlyCreatedBinders.map((binder: Binder) => (
                                <LatestBinderTile key={binder.id} binder={binder} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Binders with Newly Added Cards Section */}
            {bindersWithNewCards.length > 0 && (
                <div className='space-y-2'>
                    <h2 className='text-lg font-semibold'>Binders with Newly Added Cards</h2>
                    {loading ? (
                        <BinderSkeleton />
                    ) : (
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            {bindersWithNewCards.map((binder: Binder) => (
                                <LatestBinderTile key={binder.id} binder={binder} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default LatestBinders
