import { Button } from '@/components/ui/button'
import { Search, TextSearch, X } from 'lucide-react'
import BinderSearchTile from './components/BinderSearchTile'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import BulkSearchModal from './components/BulkSearchModal'
import { Badge } from '@/components/ui/badge'
import LatestBinders from './components/LatestBinders/LatestBinders'

export type Owner = {
    id: string
    username: string | null
    first_name: string | null
    last_name: string | null
    image_url: string | null
    isverified: boolean
    reputation: number
    location: string | null
}

export type BinderResult = {
    id: string
    owner_id: string
    name: string
    image_url: string | null
    privacy: 'public' | 'unlisted' | 'private'
    description: string | null
    totalCardsMatched: number
    totalCardsSearched: number
    cardCount: number
    matchedItems?: { name: string; quantity: number }[] // NEW
    missingItems?: { name: string; qty: number }[] // NEW
    owner: Owner
}

type SearchItem = { name: string; qty: number }

export type BulkSearchResponse = {
    results: BinderResult[]
    searchSummary: {
        totalBinders: number
        totalCardsSearched: number
        unmatchedItems: SearchItem[] // NEW
        searchItems: SearchItem[]
    }
}

const BrowsePage = () => {
    // Search state
    const [searchResults, setSearchResults] = useState<BinderResult[]>([])
    const [searchItems, setSearchItems] = useState<SearchItem[]>([])
    const [unmatchedItems, setUnmatchedItems] = useState<SearchItem[]>([]) // NEW
    const [singleSearchTerm, setSingleSearchTerm] = useState('')
    const [isSearching, setIsSearching] = useState(false)

    // Bulk Add Modal
    const [showBulkSearchModal, setShowBulkSearchModal] = useState(false)

    const handleBulkSearchResults = (payload: BulkSearchResponse) => {
        setSearchResults(payload.results)
        setSearchItems(payload.searchSummary.searchItems)
        setUnmatchedItems(payload.searchSummary.unmatchedItems || [])
        setSingleSearchTerm('')
    }

    const handleSingleSearch = async () => {
        if (!singleSearchTerm.trim()) return
        setIsSearching(true)
        try {
            const searchItem: SearchItem = { name: singleSearchTerm.toLowerCase(), qty: 1 }

            // NOTE: updated path to match backend route
            const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/binder-cards/bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ searchItems: [searchItem] }),
            })

            if (!response.ok) throw new Error('Search failed')

            const data: BulkSearchResponse = await response.json()
            setSearchResults(data.results)
            setSearchItems(data.searchSummary.searchItems)
            setUnmatchedItems(data.searchSummary.unmatchedItems || [])
        } catch (error) {
            console.error('Single search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const clearSearch = () => {
        setSearchResults([])
        setSearchItems([])
        setUnmatchedItems([]) // NEW
        setSingleSearchTerm('')
    }

    const hasActiveSearch = searchResults.length > 0 || searchItems.length > 0

    return (
        <div className='mx-auto max-w-6xl space-y-4'>
            <h1 className='text-2xl font-bold'>Browse Binders</h1>

            <div className='flex flex-col gap-2 border rounded-lg p-4'>
                <h2 className='text-sm font-semibold'>Looking for a specific card?</h2>
                <div className='flex flex-col md:flex-row justify-between gap-4'>
                    {/* Single Search */}
                    <Input
                        placeholder='ex. Cyclonic Rift'
                        className='w-full rounded-md border px-3 py-2 text-sm pr-8'
                        value={singleSearchTerm}
                        onChange={(e) => setSingleSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSingleSearch()
                            }
                        }}
                        disabled={isSearching}
                    />
                    <Button
                        variant={'default'}
                        onClick={handleSingleSearch}
                        title='Search for a card'
                        disabled={isSearching || !singleSearchTerm.trim()}
                    >
                        <Search />
                        <span>{isSearching ? 'Searching...' : 'Search'}</span>
                    </Button>
                    {/* Bulk Search */}
                    <Button
                        variant={'ghost'}
                        onClick={() => {
                            setShowBulkSearchModal(true)
                        }}
                        title='Search cards in bulk'
                        disabled={isSearching}
                    >
                        <TextSearch />
                        <span>Bulk Search</span>
                    </Button>
                </div>

                {/* Active search indicator */}
                {hasActiveSearch && (
                    <div className='flex flex-wrap items-center gap-2 pt-2'>
                        <span className='text-xs text-muted-foreground'>Searching for:</span>
                        {searchItems.map((item, index) => {
                            const isUnmatched = unmatchedItems.some(
                                (u) => u.name.toLowerCase() === item.name.toLowerCase()
                            )
                            return (
                                <Badge
                                    key={index}
                                    variant={isUnmatched ? 'destructive' : 'secondary'}
                                    className={`text-xs ${!isUnmatched ? 'bg-green-600 text-white' : ''}`}
                                >
                                    {item.qty > 1 ? `${item.qty}x ` : ''}
                                    {item.name}
                                </Badge>
                            )
                        })}
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={clearSearch}
                            className='h-6 px-2 text-xs'
                        >
                            <X className='h-3 w-3' />
                            Clear
                        </Button>
                    </div>
                )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
                <div className='flex flex-col gap-4'>
                    <h2 className='text-sm font-semibold'>
                        Search Results: {searchResults.length}{' '}
                        {searchResults.length > 1 ? 'binders' : 'binder'} found
                    </h2>
                    <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                        {searchResults.map((binder) => (
                            <BinderSearchTile key={binder.id} binder={binder} />
                        ))}
                    </div>
                </div>
            )}

            {/* No results message */}
            {hasActiveSearch && searchResults.length === 0 && !isSearching && (
                <div className='text-center py-8 text-muted-foreground'>
                    No binders found with matching cards. Try adjusting your search terms.
                </div>
            )}

            {showBulkSearchModal && (
                <BulkSearchModal
                    open={showBulkSearchModal}
                    onOpenChange={setShowBulkSearchModal}
                    onResults={handleBulkSearchResults}
                />
            )}

            <LatestBinders />
        </div>
    )
}

export default BrowsePage
