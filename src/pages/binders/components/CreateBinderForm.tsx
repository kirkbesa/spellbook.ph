// src/binders/CreateBinderForm.tsx
import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    useCreateBinder,
    type CreateBinderInput,
    type Binder,
} from '@/hooks/binders/useCreateBinder'
import { toast } from 'sonner'

// Reuse your search UI
import CardSearch from '@/pages/binders/components/CardSearch'
import { useCardSearch, type SearchResult } from '@/hooks/cards/useCardSearch'
import { X } from 'lucide-react'

type Props = { onSuccess: (binder: Binder) => void }

// Robust extractor for Scryfall art_crop (handles MDFC)
async function getArtCropUrl(scryfallId: string): Promise<string | null> {
    try {
        const r = await fetch(`https://api.scryfall.com/cards/${scryfallId}`)
        if (!r.ok) return null
        const json = await r.json()
        const direct = json?.image_uris?.art_crop ?? null
        const fromFace = json?.card_faces?.[0]?.image_uris?.art_crop ?? null
        return direct ?? fromFace ?? null
    } catch {
        return null
    }
}

export default function CreateBinderForm({ onSuccess }: Props) {
    const { createBinder, loading, error } = useCreateBinder()

    const [name, setName] = useState('')
    // const [pocket, setPocket] = useState<4 | 9 | 16>(9)
    const pocket = 9
    const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public')

    // Cover art state
    const [coverPick, setCoverPick] = useState<SearchResult | null>(null)
    const [coverArtUrl, setCoverArtUrl] = useState<string | null>(null)
    const [fetchingArt, setFetchingArt] = useState(false)

    // Search for the cover card
    const [q, setQ] = useState('')
    const { results, loading: searching, search, setResults } = useCardSearch()
    React.useEffect(() => {
        const t = setTimeout(() => search(q), 250)
        return () => clearTimeout(t)
    }, [q, search])

    const canSubmit = name.trim().length > 0 && !loading

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!canSubmit) return

        const payload: CreateBinderInput = {
            name: name.trim(),
            pocket_layout: pocket,
            privacy,
            image_url: coverArtUrl ?? null, // << use art_crop as binder cover
            // color_hex: undefined, // no longer used
        }

        try {
            const created = await createBinder(payload)
            toast.success('Binder created!')
            onSuccess(created)
        } catch {
            /* error is handled in hook */
        }
    }

    const onPickCover = async (r: SearchResult) => {
        setCoverPick(r)
        setResults([])
        setQ('')
        setFetchingArt(true)
        const art = await getArtCropUrl(r.card.scryfall_id)
        setCoverArtUrl(art ?? r.card.image_normal ?? r.card.image_small ?? null)
        setFetchingArt(false)
        if (!art) toast.message('No art-crop found for this printing; using normal image.')
    }

    const clearCover = () => {
        setCoverPick(null)
        setCoverArtUrl(null)
    }

    return (
        <Card>
            <form onSubmit={onSubmit}>
                <CardHeader className='mb-4'>
                    <CardTitle>Create a new binder</CardTitle>
                </CardHeader>

                <CardContent className='space-y-6'>
                    <div className='grid gap-4 sm:grid-cols-2'>
                        <div className='space-y-2'>
                            <Label htmlFor='name'>Binder name</Label>
                            <Input
                                id='name'
                                placeholder='e.g. Trades - EDH Staples'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* <div className='space-y-2'>
                            <Label htmlFor='pocket'>Pocket layout</Label>
                            <select
                                id='pocket'
                                className='h-10 w-full rounded-md border bg-background px-3 text-sm'
                                value={pocket}
                                onChange={(e) => setPocket(Number(e.target.value) as 4 | 9 | 16)}
                                disabled={loading}
                            >
                                <option value={4}>4-pocket</option>
                                <option value={9}>9-pocket</option>
                                <option value={16}>16-pocket</option>
                            </select>
                        </div> */}

                        <div className='space-y-2'>
                            <Label htmlFor='privacy'>Privacy</Label>
                            <select
                                id='privacy'
                                className='h-10 w-full rounded-md border bg-background px-3 text-sm'
                                value={privacy}
                                onChange={(e) =>
                                    setPrivacy(e.target.value as 'public' | 'unlisted' | 'private')
                                }
                                disabled={loading}
                            >
                                <option value='public'>Public</option>
                                <option value='unlisted'>Unlisted</option>
                                <option value='private'>Private</option>
                            </select>
                        </div>

                        {/* Cover art picker */}
                        <div className='space-y-2 sm:col-span-2'>
                            <Label>Cover art (optional)</Label>
                            <CardSearch
                                value={q}
                                onChange={(v) => {
                                    setQ(v)
                                    if (!v) setResults([])
                                }}
                                loading={searching}
                                results={results}
                                onPick={onPickCover}
                                placeholder='Search a card to use its art…'
                            />

                            {(coverPick || coverArtUrl) && (
                                <div className='mt-3 flex items-start gap-3'>
                                    <div className='h-28 w-48 overflow-hidden rounded-md border bg-muted flex items-center justify-center'>
                                        {coverArtUrl ? (
                                            <img
                                                src={coverArtUrl}
                                                alt={coverPick?.card.name ?? 'Binder cover art'}
                                                className='h-full w-full object-cover'
                                            />
                                        ) : (
                                            <div className='text-xs text-muted-foreground'>
                                                {fetchingArt ? 'Fetching art…' : 'No art'}
                                            </div>
                                        )}
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <div className='text-sm font-medium truncate'>
                                            {coverPick?.card.name ?? '—'}
                                        </div>
                                        {coverPick && (
                                            <div className='text-xs text-muted-foreground truncate'>
                                                [{coverPick.card.set_code.toUpperCase()} · #
                                                {coverPick.card.collector_number}]
                                            </div>
                                        )}
                                        <div className='mt-2'>
                                            <Button
                                                type='button'
                                                variant='ghost'
                                                size='sm'
                                                onClick={clearCover}
                                                disabled={loading}
                                            >
                                                <X className='mr-2 h-4 w-4' />
                                                Remove cover
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <p className='text-xs text-muted-foreground'>
                                We’ll use the card’s art-crop from Scryfall as your binder cover.
                            </p>
                        </div>
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}

                    <div className='flex items-center gap-2'>
                        <Button type='submit' disabled={!canSubmit}>
                            {loading ? 'Creating…' : 'Create binder'}
                        </Button>
                    </div>
                </CardContent>
            </form>
        </Card>
    )
}
