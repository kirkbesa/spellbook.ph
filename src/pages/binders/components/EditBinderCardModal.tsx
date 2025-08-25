// src/pages/binders/components/EditBinderCardModal.tsx
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import CardSearch from './CardSearch'
import { useCardSearch } from '@/hooks/cards/useCardSearch'
import type { SearchResult } from '@/hooks/cards/useCardSearch'
import type {
    BinderCard,
    CardCondition,
    CardFinish,
    PriceMode, // 'fixed' | 'scryfall'
} from '@/hooks/binders/cardTypes'
import { toast } from 'sonner'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

const LANGUAGES = [
    { code: 'EN', label: 'English' },
    { code: 'ES', label: 'Spanish' },
    { code: 'FR', label: 'French' },
    { code: 'DE', label: 'German' },
    { code: 'IT', label: 'Italian' },
    { code: 'PT', label: 'Portuguese' },
    { code: 'JA', label: 'Japanese' },
    { code: 'KO', label: 'Korean' },
    { code: 'RU', label: 'Russian' },
    { code: 'ZHS', label: 'Chinese (Simplified)' },
    { code: 'ZHT', label: 'Chinese (Traditional)' },
]

type Props = {
    open: boolean
    item: BinderCard | null
    onClose: () => void
    onSaved?: () => void
}

export default function EditBinderCardModal({ open, item, onClose, onSaved }: Props) {
    const [saving, setSaving] = React.useState(false)

    // Local form state
    const [quantity, setQuantity] = React.useState<number>(1)
    const [condition, setCondition] = React.useState<CardCondition>('NM')
    const [finish, setFinish] = React.useState<CardFinish>('non_foil')
    const [language, setLanguage] = React.useState<string>('EN')

    // Pricing
    const [priceMode, setPriceMode] = React.useState<PriceMode>('scryfall')
    const [fixedPrice, setFixedPrice] = React.useState<number | ''>('')
    const [multiplier, setMultiplier] = React.useState<number | ''>('') // PHP per $1

    // Reprint selection
    const [q, setQ] = React.useState('')
    const [picked, setPicked] = React.useState<SearchResult | null>(null)

    // Hooked search (fixes your CardSearch not working here)
    const { results, loading, search, setResults } = useCardSearch()
    React.useEffect(() => {
        const t = setTimeout(() => {
            if (q.trim()) search(q)
            else setResults([])
        }, 250)
        return () => clearTimeout(t)
    }, [q, search, setResults])

    // Seed from item on open
    React.useEffect(() => {
        if (!item) return
        setQuantity(item.quantity ?? 1)
        setCondition(item.condition)
        setFinish(item.finish)
        setLanguage(item.language ?? 'EN')

        setPriceMode(item.price_mode ?? 'scryfall')
        setFixedPrice(item.fixed_price ?? '')
        setMultiplier(item.fx_multiplier ?? '')

        setPicked(null)
        setQ('')
        setResults([])
    }, [item, setResults])

    if (!item) return null

    const currentName = item.card?.name ?? 'Unknown'
    const currentPrint = item.card
        ? `[${item.card.set_code.toUpperCase()} · #${item.card.collector_number}]`
        : ''

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { data: session } = await supabase.auth.getSession()
            const token = session.session?.access_token
            if (!token) throw new Error('Not authenticated')

            // Determine new card_id if user picked a new print
            let newCardId: string | null = null
            if (picked) {
                if (picked.source === 'scryfall') {
                    const resp = await fetch(`${API_BASE}/api/cards/cache`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(picked.card),
                    })
                    const body = await resp.json().catch(() => ({}))
                    if (!resp.ok) throw new Error(body?.error || 'Failed to cache print')
                    newCardId = body.data?.scryfall_id ?? null
                } else {
                    newCardId = picked.card.scryfall_id
                }
            }

            // Build PATCH body (send only fields that changed vs original item)
            type patchValues = Pick<
                BinderCard,
                | 'card_id'
                | 'quantity'
                | 'condition'
                | 'finish'
                | 'language'
                | 'price_mode'
                | 'fixed_price'
                | 'fx_multiplier'
            >

            const patch: patchValues = {
                card_id: item.card_id,
                quantity: item.quantity,
                condition: item.condition,
                finish: item.finish,
                language: item.language,
                price_mode: item.price_mode,
                fixed_price: item.fixed_price,
                fx_multiplier: item.fx_multiplier,
            }

            if (newCardId && newCardId !== item.card_id) patch.card_id = newCardId
            if (quantity !== item.quantity) patch.quantity = quantity
            if (condition !== item.condition) patch.condition = condition
            if (finish !== item.finish) patch.finish = finish
            if ((language ?? null) !== (item.language ?? null)) patch.language = language

            // Pricing fields
            if (priceMode !== item.price_mode) patch.price_mode = priceMode
            if (priceMode === 'fixed') {
                const val = fixedPrice === '' ? 0 : Number(fixedPrice)
                if (val !== (item.fixed_price ?? 0)) patch.fixed_price = val
                if (item.fx_multiplier != null) patch.fx_multiplier = null // clear multiplier if switching to fixed
            } else {
                // scryfall (auto) with multiplier
                const mul = multiplier === '' ? null : Number(multiplier)
                if (mul !== (item.fx_multiplier ?? null)) patch.fx_multiplier = mul
                if (item.fixed_price != null) patch.fixed_price = null // clear fixed if switching to auto
            }

            if (Object.keys(patch).length === 0) {
                onClose()
                return
            }

            const res = await fetch(`${API_BASE}/api/binder-cards/${item.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(patch),
            })
            const body = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(body?.error || 'Update failed')

            toast.success('Listing updated')
            onSaved?.()
            onClose()
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to update card'
            toast.error(msg)
            console.error('[EditBinderCardModal] error:', msg)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
            <DialogContent className='sm:max-w-[640px]'>
                <DialogHeader>
                    <DialogTitle>Edit listing</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className='space-y-5'>
                    {/* Current print summary */}
                    <div className='rounded-md border p-2 text-sm'>
                        <div className='font-medium truncate'>{currentName}</div>
                        <div className='text-muted-foreground text-xs truncate'>{currentPrint}</div>
                    </div>

                    {/* Change print */}
                    <div className='space-y-2'>
                        <Label className='text-xs'>Change card (optional)</Label>
                        <CardSearch
                            value={q}
                            onChange={(v) => {
                                setQ(v)
                                if (!v) setResults([])
                            }}
                            loading={loading}
                            results={results}
                            onPick={(r) => {
                                setPicked(r)
                                setQ(r.card.name)
                                setResults([])
                            }}
                            placeholder='Search and pick a different printing…'
                        />
                        {picked && (
                            <div className='text-xs text-muted-foreground'>
                                New print selected: {picked.card.name} [
                                {picked.card.set_code.toUpperCase()} · #
                                {picked.card.collector_number}]
                            </div>
                        )}
                    </div>

                    {/* Editable fields */}
                    <div className='grid gap-4 sm:grid-cols-2'>
                        <div className='space-y-1'>
                            <Label className='text-xs'>Quantity</Label>
                            <Input
                                type='number'
                                min={1}
                                value={quantity}
                                onChange={(e) =>
                                    setQuantity(Math.max(1, Number(e.target.value || 1)))
                                }
                            />
                        </div>

                        <div className='space-y-1'>
                            <Label className='text-xs'>Condition</Label>
                            <Select
                                value={condition}
                                onValueChange={(v) => setCondition(v as CardCondition)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='Condition' />
                                </SelectTrigger>
                                <SelectContent>
                                    {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='space-y-1'>
                            <Label className='text-xs'>Finish</Label>
                            <Select
                                value={finish}
                                onValueChange={(v) => setFinish(v as CardFinish)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='Finish' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='non_foil'>Non-foil</SelectItem>
                                    <SelectItem value='foil'>Foil</SelectItem>
                                    <SelectItem value='etched'>Etched</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='space-y-1'>
                            <Label className='text-xs'>Language</Label>
                            <Select
                                value={language}
                                onValueChange={(v) => setLanguage(v.toUpperCase())}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder='Select language' />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map((l) => (
                                        <SelectItem key={l.code} value={l.code}>
                                            {l.label} ({l.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className='space-y-2'>
                        <Label>Pricing</Label>
                        <RadioGroup
                            className='flex gap-6'
                            value={priceMode}
                            onValueChange={(v) => setPriceMode(v as PriceMode)}
                        >
                            <label className='flex items-center gap-2'>
                                <RadioGroupItem value='fixed' id='pm-fixed' />
                                <span>Fixed (PHP)</span>
                            </label>
                            <label className='flex items-center gap-2'>
                                <RadioGroupItem value='scryfall' id='pm-auto' />
                                <span>Auto (Scryfall × multiplier)</span>
                            </label>
                        </RadioGroup>

                        {priceMode === 'fixed' ? (
                            <div className='mt-2 flex items-center gap-2'>
                                <Input
                                    type='number'
                                    min={0}
                                    step='0.01'
                                    value={fixedPrice}
                                    onChange={(e) =>
                                        setFixedPrice(
                                            e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                    }
                                    placeholder='0.00'
                                    className='w-40'
                                />
                                <span className='text-sm text-muted-foreground'>PHP</span>
                            </div>
                        ) : (
                            <div className='mt-2 flex items-center gap-2'>
                                <Input
                                    type='number'
                                    min={0}
                                    step='1'
                                    value={multiplier}
                                    onChange={(e) =>
                                        setMultiplier(
                                            e.target.value === '' ? '' : Number(e.target.value)
                                        )
                                    }
                                    placeholder='50'
                                    className='w-28'
                                />
                                <span className='text-sm text-muted-foreground'>× (USD → PHP)</span>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type='button' variant='ghost' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type='submit' disabled={saving}>
                            {saving ? 'Saving…' : 'Save changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
