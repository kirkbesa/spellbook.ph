// src/pages/binders/BinderSettingsPage.tsx
import * as React from 'react'
import type { Binder } from '@/hooks/binders/types'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'
import BackButton from '@/components/common/BackButton'
import { useRouter } from '@tanstack/react-router'

// Reuse your card search UI + hook
import CardSearch from '@/pages/binders/components/CardSearch'
import { useCardSearch } from '@/hooks/cards/useCardSearch'
import type { SearchResult } from '@/pages/binders/components/types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

type Props = {
    binder: Binder
}

export default function BinderSettingsPage({ binder }: Props) {
    const router = useRouter()
    const [name, setName] = React.useState(binder.name)
    const [privacy, setPrivacy] = React.useState<Binder['privacy']>(binder.privacy)
    const [description, setDescription] = React.useState(binder.description ?? '')

    // Cover art (Scryfall art-crop URL) — default from binder
    const [coverUrl, setCoverUrl] = React.useState<string>(binder.image_url ?? '')
    const [saving, setSaving] = React.useState(false)

    // Search state for picking cover
    const [q, setQ] = React.useState('')
    const { results, loading, search, setResults } = useCardSearch()

    // Debounced search
    React.useEffect(() => {
        const t = setTimeout(() => search(q), 250)
        return () => clearTimeout(t)
    }, [q, search])

    const onPickCover = (r: SearchResult) => {
        // Build Scryfall art-crop image URL from the card id
        // This returns the actual image directly (no JSON), perfect to store in image_url
        const artUrl = `https://api.scryfall.com/cards/${r.card.scryfall_id}?format=image&version=art_crop`
        setCoverUrl(artUrl)
        setResults([]) // close suggestions
        toast.success('Cover art selected')
    }

    const onClearCover = () => {
        setCoverUrl('')
        toast.message('Cover art cleared')
    }

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { data: session } = await supabase.auth.getSession()
            const token = session.session?.access_token
            if (!token) throw new Error('Not authenticated')

            const res = await fetch(`${API_BASE}/api/binders/${binder.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    privacy,
                    image_url: coverUrl || null, // ← store chosen art-crop URL or null
                    description: description.trim() || null,
                    // color_hex: null, // optional: if you want to explicitly clear legacy color
                }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error || `Update failed (${res.status})`)
            }

            await router.invalidate()
            toast.success('Binder updated')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update binder')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className='mx-auto w-full max-w-3xl space-y-6'>
            <BackButton fallbackTo='/binders' />
            <h1 className='text-xl font-semibold'>Binder Settings</h1>

            <form onSubmit={onSave} className='space-y-4 rounded-lg border p-4'>
                {/* Name / Privacy */}
                <div className='space-y-1'>
                    <label className='text-sm font-medium'>Name</label>
                    <input
                        className='w-full rounded-md border px-3 py-2 text-sm'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='Binder name'
                    />
                </div>

                <div className='space-y-1'>
                    <label className='text-sm font-medium'>Description</label>
                    <textarea
                        className='w-full rounded-md border px-3 py-2 text-sm min-h-[100px]'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder='Describe what’s inside this binder…'
                    />
                </div>

                <div className='space-y-1'>
                    <label className='text-sm font-medium'>Privacy</label>
                    <select
                        className='w-full rounded-md border px-3 py-2 text-sm'
                        value={privacy}
                        onChange={(e) => setPrivacy(e.target.value as Binder['privacy'])}
                    >
                        <option value='public'>Public</option>
                        <option value='unlisted'>Unlisted</option>
                        <option value='private'>Private</option>
                    </select>
                </div>

                {/* Cover preview */}
                <div className='space-y-2'>
                    <label className='text-sm font-medium'>Cover art</label>
                    <div className='rounded-lg border'>
                        <div className='relative h-48 w-full overflow-hidden rounded-t-lg bg-muted'>
                            {coverUrl ? (
                                <>
                                    <img
                                        src={coverUrl}
                                        alt=''
                                        className='h-full w-full object-cover object-[50%_20%]'
                                        // tweak focus using object-position utilities if you need, e.g. object-[50%_20%]
                                    />
                                    {/* bottom fade → background */}
                                    <div className='pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[hsl(var(--background))]' />
                                </>
                            ) : (
                                <div className='flex h-full w-full items-center justify-center text-xs text-muted-foreground'>
                                    No cover selected
                                </div>
                            )}
                        </div>

                        {/* Picker row */}
                        <div className='grid gap-3 p-3 sm:grid-cols-[1fr_auto_auto]'>
                            <div>
                                <CardSearch
                                    value={q}
                                    onChange={(v) => {
                                        setQ(v)
                                        if (!v) setResults([])
                                    }}
                                    loading={loading}
                                    results={results}
                                    onPick={onPickCover}
                                    placeholder='Search a card to use its art…'
                                />
                            </div>

                            <button
                                type='button'
                                onClick={onClearCover}
                                className='h-9 rounded-md border px-3 text-sm hover:bg-accent disabled:opacity-50'
                                disabled={!coverUrl}
                            >
                                Clear cover
                            </button>

                            <button
                                type='button'
                                onClick={() => setCoverUrl(coverUrl)} // noop; left as placeholder if you add adjustments later
                                className='h-9 rounded-md border px-3 text-sm hover:bg-accent disabled:opacity-50'
                                disabled={!coverUrl}
                                title='(Optional) Save after adjusting position if you add that feature'
                            >
                                Keep as shown
                            </button>
                        </div>
                    </div>
                </div>

                <div className='flex items-center gap-2'>
                    <button
                        type='submit'
                        disabled={saving}
                        className='rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50'
                    >
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
