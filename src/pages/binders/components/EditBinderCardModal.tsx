// src/pages/binders/components/EditBinderCardModal.tsx
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check } from 'lucide-react'
import CardSearch from './CardSearch'
import { useCardSearch } from '@/hooks/cards/useCardSearch'
import type { SearchResult } from '@/hooks/cards/useCardSearch'
import type { BinderCard, CardCondition, CardFinish, PriceMode } from '@/hooks/binders/cardTypes'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const API_BASE = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

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

type Props = { open: boolean; item: BinderCard | null; onClose: () => void; onSaved?: () => void }

type PrintRow = {
    scryfall_id: string
    oracle_id: string
    name: string
    set_code: string
    collector_number: string
    image_small: string | null
    image_normal: string | null
    set_icon_svg_uri: string | null
    scry_usd: number | null
    scry_usd_foil: number | null
    scry_usd_etched: number | null
    scry_prices_updated_at: string | null
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
    const [multiplier, setMultiplier] = React.useState<number | ''>('')

    // Change card (different oracle)
    const [q, setQ] = React.useState('')
    const [picked, setPicked] = React.useState<SearchResult | null>(null)
    const { results, loading, search, setResults } = useCardSearch()

    React.useEffect(() => {
        const t = setTimeout(() => {
            if (q.trim()) search(q)
            else setResults([])
        }, 250)
        return () => clearTimeout(t)
    }, [q, search, setResults])

    // Change printing (same oracle)
    const [prints, setPrints] = React.useState<PrintRow[]>([])
    const [loadingPrints, setLoadingPrints] = React.useState(false)
    const [selectedPrintId, setSelectedPrintId] = React.useState<string | null>(null)
    const [hoveredPrintId, setHoveredPrintId] = React.useState<string | null>(null)

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
        setSelectedPrintId(null)
        setHoveredPrintId(null)
    }, [item, setResults])

    // Fetch prints for current (or picked) oracle — robust resolution of oracle_id
    React.useEffect(() => {
        if (!open || !item) {
            setPrints([])
            return
        }

        const fetchPrints = async () => {
            setLoadingPrints(true)
            try {
                // 1) Figure out the oracle_id
                let oracleId: string | null =
                    picked?.card?.oracle_id || item?.card?.oracle_id || null

                if (!oracleId) {
                    // fallback: read the card row (public CRUD) using current id
                    const sourceCardId = picked?.card?.scryfall_id || item.card_id
                    if (sourceCardId) {
                        const r = await fetch(`${API_BASE}/api/cards/${sourceCardId}`)
                        const j = await r.json().catch(() => ({}))
                        if (r.ok && j?.data?.oracle_id) {
                            oracleId = j.data.oracle_id
                        }
                    }
                }

                if (!oracleId) {
                    setPrints([])
                    return
                }

                // 2) Fetch the oracle's prints
                const res = await fetch(`${API_BASE}/api/cards/prints/${oracleId}`)
                const json = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(json?.error || 'Failed to load printings')

                const data = (json.data ?? []) as PrintRow[]

                // 3) Sort (rough newish first): set_code desc, then collector_number desc
                const sorted = data.slice().sort((a, b) => {
                    if (a.set_code !== b.set_code) return a.set_code < b.set_code ? 1 : -1
                    const an = parseInt(a.collector_number.replace(/\D/g, '') || '0', 10)
                    const bn = parseInt(b.collector_number.replace(/\D/g, '') || '0', 10)
                    return bn - an
                })

                setPrints(sorted)
            } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed to load printings')
                setPrints([])
            } finally {
                setLoadingPrints(false)
            }
        }

        fetchPrints()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, item?.id, item?.card_id, picked])

    // ----- derive values WITHOUT returning early (keep hooks order stable) -----

    const printOptions: PrintRow[] = React.useMemo(() => {
        if (!item) return prints
        const exists = prints.some((p) => p.scryfall_id === item.card_id)
        if (exists) return prints
        const cur = item.card
            ? {
                  scryfall_id: item.card_id,
                  oracle_id: item.card?.oracle_id ?? '',
                  name: item.card.name ?? 'Current',
                  set_code: item.card.set_code ?? '',
                  collector_number: item.card.collector_number ?? '',
                  image_small: null,
                  image_normal: null,
                  set_icon_svg_uri: null,
                  scry_usd: null,
                  scry_usd_foil: null,
                  scry_usd_etched: null,
                  scry_prices_updated_at: null,
              }
            : {
                  scryfall_id: item.card_id,
                  oracle_id: '',
                  name: 'Current',
                  set_code: '',
                  collector_number: '',
                  image_small: null,
                  image_normal: null,
                  set_icon_svg_uri: null,
                  scry_usd: null,
                  scry_usd_foil: null,
                  scry_usd_etched: null,
                  scry_prices_updated_at: null,
              }
        return [cur, ...prints]
    }, [prints, item])

    const currentName = item?.card?.name ?? '—'
    const currentPrint = item?.card
        ? `[${item.card.set_code.toUpperCase()} · #${item.card.collector_number}]`
        : '—'

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!item) return // nothing to do without a target row
        setSaving(true)
        try {
            const { data: session } = await supabase.auth.getSession()
            const token = session.session?.access_token
            if (!token) throw new Error('Not authenticated')

            // New card_id from: picked (different card) OR selected different printing
            let newCardId: string | null = null
            if (picked) newCardId = picked.card.scryfall_id
            else if (selectedPrintId && selectedPrintId !== item.card_id)
                newCardId = selectedPrintId

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
            const patch: Partial<patchValues> = {}

            if (newCardId && newCardId !== item.card_id) patch.card_id = newCardId
            if (quantity !== (item.quantity ?? 1)) patch.quantity = quantity
            if (condition !== item.condition) patch.condition = condition
            if (finish !== item.finish) patch.finish = finish
            if ((language ?? null) !== (item.language ?? null)) patch.language = language

            // Pricing
            if (priceMode !== item.price_mode) patch.price_mode = priceMode
            if (priceMode === 'fixed') {
                const val = fixedPrice === '' ? 0 : Number(fixedPrice)
                if (val !== (item.fixed_price ?? 0)) patch.fixed_price = val
                if (item.fx_multiplier != null) patch.fx_multiplier = null
            } else {
                const mul = multiplier === '' ? null : Number(multiplier)
                if (mul !== (item.fx_multiplier ?? null)) patch.fx_multiplier = mul
                if (item.fixed_price != null) patch.fixed_price = null
            }

            if (Object.keys(patch).length === 0) {
                onClose()
                return
            }

            const res = await fetch(`${API_BASE}/api/binder-cards/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
            <DialogContent className='sm:max-w-[900px]'>
                <DialogHeader>
                    <DialogTitle>Edit listing</DialogTitle>
                </DialogHeader>

                {/* If no item yet, show a lightweight placeholder to keep hooks order stable */}
                {!item ? (
                    <div className='text-sm text-muted-foreground p-3'>Loading…</div>
                ) : (
                    <form onSubmit={onSubmit} className='space-y-5'>
                        {/* Current print summary */}
                        <div className='rounded-md border p-2 text-sm'>
                            <div className='font-medium truncate'>{currentName}</div>
                            <div className='text-muted-foreground text-xs truncate'>
                                {currentPrint}
                            </div>
                        </div>

                        {/* Change card (different oracle) */}
                        <div className='space-y-2'>
                            <Label className='text-xs'>Change card (optional)</Label>
                            <CardSearch
                                value={q}
                                onChange={(v) => {
                                    setQ(v)
                                    if (!v) setResults([])
                                    setSelectedPrintId(null)
                                    setHoveredPrintId(null)
                                }}
                                loading={loading}
                                results={results}
                                onPick={(r) => {
                                    setPicked(r)
                                    setQ(r.card.name)
                                    setResults([])
                                    setSelectedPrintId(null)
                                    setHoveredPrintId(null)
                                }}
                                placeholder='Search and pick a different card…'
                            />
                            {picked && (
                                <div className='text-xs text-muted-foreground'>
                                    New card selected: {picked.card.name} [
                                    {picked.card.set_code.toUpperCase()} · #
                                    {picked.card.collector_number}]
                                </div>
                            )}
                        </div>

                        {/* Change printing (same oracle) */}
                        <div className='space-y-2'>
                            <Label className='text-xs'>Change printing (set) — same card</Label>
                            <PrintingPicker
                                options={printOptions}
                                currentId={item.card_id}
                                value={selectedPrintId}
                                onChange={(v) => {
                                    if (v === item.card_id) setSelectedPrintId(null)
                                    else setSelectedPrintId(v)
                                    setPicked(null) // picking a printing cancels "new card"
                                }}
                                loading={loadingPrints}
                                hoveredId={hoveredPrintId}
                                onHover={(id) => setHoveredPrintId(id)}
                            />
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
                                <select
                                    value={condition}
                                    onChange={(e) => setCondition(e.target.value as CardCondition)}
                                    className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                                >
                                    {['NM', 'LP', 'MP', 'HP', 'DMG'].map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className='space-y-1'>
                                <Label className='text-xs'>Finish</Label>
                                <select
                                    value={finish}
                                    onChange={(e) => setFinish(e.target.value as CardFinish)}
                                    className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                                >
                                    <option value='non_foil'>Non-foil</option>
                                    <option value='foil'>Foil</option>
                                    <option value='etched'>Etched</option>
                                </select>
                            </div>

                            <div className='space-y-1'>
                                <Label className='text-xs'>Language</Label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value.toUpperCase())}
                                    className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                                >
                                    {LANGUAGES.map((l) => (
                                        <option key={l.code} value={l.code}>
                                            {l.label} ({l.code})
                                        </option>
                                    ))}
                                </select>
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
                                    <span className='text-sm text-muted-foreground'>
                                        × (USD → PHP)
                                    </span>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type='button' variant='ghost' onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type='submit' disabled={saving || !item}>
                                {saving ? 'Saving…' : 'Save changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}

/** Printing picker with right-side preview (CardSearch-like) */
function PrintingPicker({
    options,
    currentId,
    value,
    onChange,
    loading,
    hoveredId,
    onHover,
}: {
    options: PrintRow[]
    currentId: string
    value: string | null
    onChange: (v: string) => void
    loading: boolean
    hoveredId: string | null
    onHover: (id: string | null) => void
}) {
    const [open, setOpen] = React.useState(false)

    const selectedId = value ?? currentId
    const selected = options.find((p) => p.scryfall_id === selectedId)
    const hovered = options.find((p) => p.scryfall_id === hoveredId)
    const previewSrc =
        hovered?.image_normal ||
        hovered?.image_small ||
        selected?.image_normal ||
        selected?.image_small ||
        null

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {/* full-width trigger */}
                <Button variant='outline' className='w-full justify-between'>
                    <span className='truncate'>
                        {selected
                            ? `[${(selected.set_code || '').toUpperCase()} · #${selected.collector_number || '—'}] ${selected.name}`
                            : 'Select a printing'}
                    </span>
                    <span className='ml-2 text-xs text-muted-foreground'>
                        {loading ? 'Loading…' : 'Change'}
                    </span>
                </Button>
            </PopoverTrigger>

            {/* wide on mobile (near full viewport), capped on desktop */}
            <PopoverContent className='p-0 w-[min(92vw,900px)]'>
                <div className='flex flex-col md:flex-row'>
                    {/* Left: list — full width on mobile, flex-1 on desktop */}
                    <ScrollArea className='w-full md:flex-1 md:w-auto max-h-[60vh] md:h-[340px] p-2'>
                        {options.length === 0 ? (
                            <div className='p-3 text-sm text-muted-foreground'>
                                {loading ? 'Loading printings…' : 'No alternate printings found'}
                            </div>
                        ) : (
                            <ul className='space-y-1'>
                                {options.map((p) => (
                                    <li key={p.scryfall_id}>
                                        <button
                                            type='button'
                                            className={cn(
                                                'w-full rounded-md px-2 py-2 text-left hover:bg-accent focus:bg-accent flex items-center gap-2',
                                                p.scryfall_id === selectedId && 'bg-accent'
                                            )}
                                            onClick={() => {
                                                onChange(p.scryfall_id)
                                                setOpen(false)
                                            }}
                                            onMouseEnter={() => onHover(p.scryfall_id)}
                                            onMouseLeave={() => onHover(null)}
                                        >
                                            {p.set_icon_svg_uri && (
                                                <img
                                                    src={p.set_icon_svg_uri}
                                                    alt=''
                                                    className='h-4 w-4 shrink-0'
                                                    onError={(e) =>
                                                        ((
                                                            e.currentTarget as HTMLImageElement
                                                        ).style.display = 'none')
                                                    }
                                                />
                                            )}
                                            <span className='truncate text-sm'>
                                                [{(p.set_code || '').toUpperCase()} · #
                                                {p.collector_number || '—'}] {p.name}
                                            </span>
                                            {p.scryfall_id === selectedId && (
                                                <Check className='ml-auto h-4 w-4 opacity-60' />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </ScrollArea>

                    {/* Right: preview — hidden on mobile, fixed width on desktop */}
                    <div className='hidden md:flex w-[260px] border-t md:border-t-0 md:border-l p-2 items-center justify-center'>
                        {previewSrc ? (
                            <img
                                src={previewSrc}
                                alt='Printing preview'
                                className='max-h-[320px] w-auto rounded-md border object-contain'
                                draggable={false}
                            />
                        ) : (
                            <div className='h-[320px] w-full rounded-md border bg-muted/40' />
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
