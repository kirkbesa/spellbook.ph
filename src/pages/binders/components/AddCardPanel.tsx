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
import type { SearchResult, CardCondition, CardFinish, PriceMode } from './types'
import CardSearch from './CardSearch'
import { ChevronUp, ChevronDown, X, TextSearch } from 'lucide-react'
import BulkAddModal from './BulkAddModal'

type Props = { binderId: string; onAdded?: () => void }

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
    const [q, setQ] = React.useState('')
    const { results, loading, search, setResults } = useCardSearch()

    const [picked, setPicked] = React.useState<SearchResult | null>(null)
    const [collapsed, setCollapsed] = React.useState(false)

    React.useEffect(() => {
        if (!q.trim()) {
            setResults([])
            return
        }
        const t = setTimeout(() => search(q), 250)
        return () => clearTimeout(t)
    }, [q, search, setResults])

    const { add, saving } = useAddBinderCard(binderId)

    const [quantity, setQuantity] = React.useState(1)
    const [condition, setCondition] = React.useState<CardCondition>('NM')
    const [finish, setFinish] = React.useState<CardFinish>('non_foil')
    const [language, setLanguage] = React.useState('EN')

    // pricing: fixed or scryfall (auto with multiplier)
    const [priceMode, setPriceMode] = React.useState<PriceMode>('scryfall')
    const [fixedPrice, setFixedPrice] = React.useState<number | ''>('')
    const [multiplier, setMultiplier] = React.useState<number | ''>(50)

    const resetForm = () => {
        setQuantity(1)
        setCondition('NM')
        setFinish('non_foil')
        setLanguage('EN')
        setPriceMode('scryfall')
        setFixedPrice('')
        setMultiplier(50)
    }

    const handleCloseForm = () => {
        setPicked(null)
        setCollapsed(false)
        resetForm()
    }

    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && picked) handleCloseForm()
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [picked])

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
                price_mode: priceMode, // 'fixed' | 'scryfall'
                fixed_price: priceMode === 'fixed' ? Number(fixedPrice || 0) : null,
                fx_multiplier: priceMode === 'scryfall' ? Number(multiplier || 0) : null,
            })
            onAdded?.()
            toast.success('Added to binder')
            resetForm()
            setPicked(null)
            setCollapsed(false)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add')
        }
    }

    // Bulk Add Modal
    const [showBulkModal, setShowBulkModal] = React.useState(false)

    return (
        <div className='rounded-lg border p-3'>
            <div className='w-full flex justify-between items-center pb-3 px-1'>
                <h2 className='mb-2 text-sm font-medium'>Add Cards</h2>
                <Button
                    variant={'ghost'}
                    onClick={() => setShowBulkModal(true)}
                    title='Add cards in bulk'
                >
                    <TextSearch />
                    Bulk Add
                </Button>
            </div>

            {showBulkModal && (
                <BulkAddModal
                    binderId={binderId}
                    open={showBulkModal}
                    onOpenChange={setShowBulkModal}
                    onAdded={onAdded}
                />
            )}

            <CardSearch
                value={q}
                onChange={setQ}
                loading={loading}
                results={results}
                onPick={(r) => {
                    setPicked(r)
                    setResults([])
                    setCollapsed(false)
                }}
                placeholder='Search card name…'
            />

            {picked && (
                <div className='mt-3 rounded-md'>
                    <div className='flex items-center justify-between gap-3 px-3 py-2'>
                        <div className='flex min-w-0 items-center gap-3'>
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
                                    className='mr-1 inline-block h-8 w-8 align-text-bottom'
                                    alt=''
                                    loading='lazy'
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

                    <div className='flex flex-col justify-center gap-6 px-3 py-2 md:flex-row'>
                        <div className='mb-4 h-full w-64 shrink-0 overflow-hidden rounded-md bg-muted md:mx-0'>
                            {(picked.card.image_normal || picked.card.image_small) && (
                                <img
                                    src={picked.card.image_normal ?? picked.card.image_small ?? ''}
                                    alt={picked.card.name}
                                    className='h-full w-full object-cover'
                                    loading='lazy'
                                />
                            )}
                        </div>

                        {!collapsed && (
                            <form onSubmit={onSubmit} className='flex flex-col gap-4 px-3 pb-3'>
                                <div className='flex flex-col gap-4 md:flex-row'>
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

                                    <div className='space-y-1'>
                                        <Label className='text-xs'>Condition</Label>
                                        <Select
                                            value={condition}
                                            onValueChange={(v) => setCondition(v as CardCondition)}
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
                                            onValueChange={(v) => setFinish(v as CardFinish)}
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

                                <div className='space-y-2'>
                                    <Label>Pricing</Label>
                                    <RadioGroup
                                        className='flex gap-6'
                                        value={priceMode}
                                        onValueChange={(v) => setPriceMode(v as PriceMode)}
                                    >
                                        <label className='flex items-center gap-2'>
                                            <RadioGroupItem value='fixed' id='pm-fixed' />
                                            <span>Fixed</span>
                                        </label>
                                        <label className='flex items-center gap-2'>
                                            <RadioGroupItem value='scryfall' id='pm-auto' />
                                            <span>Auto (Scryfall)</span>
                                        </label>
                                    </RadioGroup>

                                    {priceMode === 'fixed' && (
                                        <div className='mt-2 flex items-center gap-2'>
                                            <Input
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
                                                className='w-40'
                                            />
                                            <span className='text-sm text-muted-foreground'>
                                                PHP (manual)
                                            </span>
                                        </div>
                                    )}

                                    {priceMode === 'scryfall' && (
                                        <div className='mt-2 flex items-center gap-2'>
                                            <Input
                                                type='number'
                                                min={0}
                                                step='1'
                                                value={multiplier}
                                                onChange={(e) =>
                                                    setMultiplier(
                                                        e.target.value === ''
                                                            ? ''
                                                            : Number(e.target.value)
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

                                <div className='flex items-center justify-end gap-2'>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='sm'
                                        onClick={handleCloseForm}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type='submit'
                                        size='sm'
                                        disabled={
                                            saving || (priceMode === 'fixed' && fixedPrice === '')
                                        }
                                    >
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
