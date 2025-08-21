// src/pages/binders/components/AddCardPanel.tsx
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { useCardSearch } from '@/hooks/cards/useCardSearch'
import { useAddBinderCard } from '@/hooks/binders/useAddBinderCard'
import type { SearchResult, CardCondition, CardFinish, PriceMode, TcgBasis } from './types'
import CardSearch from './CardSearch'
import { ChevronUp, ChevronDown, X } from 'lucide-react'

type Props = { binderId: string; onAdded?: () => void }

// Common MTG language codes (stored uppercase like your prior usage)
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

export default function AddCardPanel({ binderId, onAdded }: Props) {
    // Search state (always visible)
    const [q, setQ] = React.useState('')
    const { results, loading, search, setResults } = useCardSearch()

    // Form state (appears after pick)
    const [picked, setPicked] = React.useState<SearchResult | null>(null)
    const [collapsed, setCollapsed] = React.useState(false)

    // Debounced search
    React.useEffect(() => {
        const t = setTimeout(() => search(q), 250)
        return () => clearTimeout(t)
    }, [q, search])

    // Close form on Escape (search bar stays)
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && picked) handleCloseForm()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [picked])

    const { add, saving } = useAddBinderCard(binderId)

    const [quantity, setQuantity] = React.useState(1)
    const [condition, setCondition] = React.useState<CardCondition>('NM')
    const [finish, setFinish] = React.useState<CardFinish>('non_foil')
    const [language, setLanguage] = React.useState('EN')

    // Default pricing to TCGplayer Listed Median
    const [priceMode, setPriceMode] = React.useState<PriceMode>('tcgplayer')
    const [fixedPrice, setFixedPrice] = React.useState<number | ''>('')
    const [basis, setBasis] = React.useState<TcgBasis>('listed_median')

    const resetForm = () => {
        setQuantity(1)
        setCondition('NM')
        setFinish('non_foil')
        setLanguage('EN')
        setPriceMode('tcgplayer')
        setFixedPrice('')
        setBasis('listed_median')
    }

    const handleCloseForm = () => {
        setPicked(null)
        setCollapsed(false)
        resetForm()
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!picked) return toast.error('Pick a card first')

        try {
            await add({
                selected: picked,
                quantity,
                finish,
                condition,
                language,
                price_mode: priceMode,
                fixed_price: priceMode === 'fixed' ? Number(fixedPrice || 0) : null,
                tcg_basis: priceMode === 'tcgplayer' ? basis : null,
            })
            onAdded?.()
            toast.success('Added to binder')
            resetForm()
            // keep search term; allow adding another card quickly
            setPicked(null)
            setCollapsed(false)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add')
        }
    }

    return (
        <div className='rounded-lg border p-3'>
            <h2 className='text-sm font-medium mb-2'>Add Cards</h2>
            {/* Always-visible search */}
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
                    setResults([])
                    setCollapsed(false)
                }}
                placeholder='Search card name…'
            />

            {/* Closeable/Collapsible details form */}
            {picked && (
                <div className='mt-3 rounded-md'>
                    {/* Form header with image + info */}
                    <div className='flex items-center justify-between gap-3 px-3 py-2'>
                        <div className='flex items-center gap-3 min-w-0'>
                            <div className='min-w-0 text-sm'>
                                <div className='truncate font-medium'>{picked.card.name}</div>
                                <div className='truncate text-muted-foreground'>
                                    [{picked.card.set_code.toUpperCase()} · #
                                    {picked.card.collector_number}]
                                </div>
                            </div>
                            {picked.card.set_icon_svg_uri && (
                                <img
                                    src={picked.card.set_icon_svg_uri}
                                    className='inline-block h-8 w-8 align-text-bottom mr-1'
                                />
                            )}
                        </div>
                        <div className='flex items-center gap-1'>
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7'
                                title={collapsed ? 'Expand' : 'Collapse'}
                                onClick={() => setCollapsed((v) => !v)}
                            >
                                {collapsed ? (
                                    <ChevronDown className='h-4 w-4' />
                                ) : (
                                    <ChevronUp className='h-4 w-4' />
                                )}
                            </Button>
                            <Button
                                variant='ghost'
                                size='icon'
                                className='h-7 w-7'
                                title='Close'
                                onClick={handleCloseForm}
                            >
                                <X className='h-4 w-4' />
                            </Button>
                        </div>
                    </div>

                    <div className='flex flex-col md:flex-row px-3 py-2 gap-6 justify-center'>
                        <div className='h-full w-64 mx-auto md:mx-0 mb-4 overflow-hidden rounded-md bg-muted shrink-0'>
                            {picked.card.image_normal || picked.card.image_small ? (
                                <img
                                    src={picked.card.image_normal ?? picked.card.image_small ?? ''}
                                    alt={picked.card.name}
                                    className='h-full w-full object-cover'
                                />
                            ) : null}
                        </div>

                        {!collapsed && (
                            <form onSubmit={onSubmit} className='px-3 pb-3 flex-col gap-4 flex'>
                                {/* Compact grid */}
                                <div className='flex flex-col md:flex-row gap-4'>
                                    <div className='space-y-1'>
                                        <Label className='text-xs'>Qty</Label>
                                        <Input
                                            className='h-8'
                                            type='number'
                                            min={1}
                                            value={quantity}
                                            onChange={(e) =>
                                                setQuantity(
                                                    Math.max(1, Number(e.target.value || 1))
                                                )
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className='space-y-1'>
                                    <Label className='text-xs'>Pricing</Label>
                                    <div className='flex flex-col gap-4 md:flex-row'>
                                        <RadioGroup
                                            className='flex gap-4'
                                            value={priceMode}
                                            onValueChange={(v) => setPriceMode(v as any)}
                                        >
                                            <label className='flex items-center gap-1.5 text-sm'>
                                                <RadioGroupItem value='fixed' id='pm-fixed' />
                                                Fixed
                                            </label>
                                            <label className='flex items-center gap-1.5 text-sm'>
                                                <RadioGroupItem value='tcgplayer' id='pm-tcg' />
                                                TCGplayer
                                            </label>
                                        </RadioGroup>

                                        {priceMode === 'fixed' ? (
                                            <div className='flex items-center gap-2'>
                                                <Input
                                                    className='h-8 w-28'
                                                    type='number'
                                                    min={0}
                                                    step='0.01'
                                                    value={fixedPrice}
                                                    onChange={(e) =>
                                                        setFixedPrice(
                                                            e.target.value === ''
                                                                ? ''
                                                                : Number(e.target.value)
                                                        )
                                                    }
                                                    placeholder='0.00'
                                                />
                                                <span className='text-xs text-muted-foreground'>
                                                    PHP
                                                </span>
                                            </div>
                                        ) : (
                                            <div className='flex items-center gap-2'>
                                                <Select
                                                    value={basis}
                                                    onValueChange={(v) => setBasis(v as any)}
                                                >
                                                    <SelectTrigger className='h-8 w-44'>
                                                        <SelectValue placeholder='Basis' />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value='listed_median'>
                                                            Listed median
                                                        </SelectItem>
                                                        <SelectItem value='market'>
                                                            Market
                                                        </SelectItem>
                                                        <SelectItem value='high'>High</SelectItem>
                                                        <SelectItem value='low'>Low</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className='flex flex-col gap-4 md:flex-row'>
                                    <div className='space-y-1'>
                                        <Label className='text-xs'>Condition</Label>
                                        <Select
                                            value={condition}
                                            onValueChange={(v) => setCondition(v as any)}
                                        >
                                            <SelectTrigger className='h-8'>
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
                                            onValueChange={(v) => setFinish(v as any)}
                                        >
                                            <SelectTrigger className='h-8'>
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
                                            <SelectTrigger className='h-8'>
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

                                <div className='flex-1'></div>

                                {/* Actions */}
                                <div className='flex items-center justify-end gap-2'>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='sm'
                                        onClick={handleCloseForm}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type='submit' size='sm' disabled={saving}>
                                        {saving ? 'Adding…' : 'Add to binder'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
