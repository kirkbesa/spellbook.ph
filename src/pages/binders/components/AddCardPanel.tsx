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

type Props = { binderId: string; onAdded?: () => void }

export default function AddCardPanel({ binderId, onAdded }: Props) {
    const [q, setQ] = React.useState('')
    const [picked, setPicked] = React.useState<SearchResult | null>(null)

    const { results, loading, search, setResults } = useCardSearch()
    const { add, saving } = useAddBinderCard(binderId)

    // Debounced search
    React.useEffect(() => {
        const t = setTimeout(() => search(q), 250)
        return () => clearTimeout(t)
    }, [q, search])

    const [quantity, setQuantity] = React.useState(1)
    const [condition, setCondition] = React.useState<CardCondition>('NM')
    const [finish, setFinish] = React.useState<CardFinish>('non_foil')
    const [language, setLanguage] = React.useState('EN')
    const [priceMode, setPriceMode] = React.useState<PriceMode>('fixed')
    const [fixedPrice, setFixedPrice] = React.useState<number | ''>('')
    const [basis, setBasis] = React.useState<TcgBasis>('listed_median')

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
            // reset quantity but keep last query/picked
            setQuantity(1)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to add')
        }
    }

    return (
        <div className='rounded-lg border p-4'>
            <h3 className='mb-3 text-base font-semibold'>Add cards</h3>

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
                }}
            />

            {picked && (
                <form onSubmit={onSubmit} className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div className='space-y-2'>
                        <Label>Selected</Label>
                        <div className='rounded-md border p-2 text-sm'>
                            <div className='font-medium truncate'>{picked.card.name}</div>
                            <div className='text-muted-foreground text-xs'>
                                [{picked.card.set_code.toUpperCase()} · #
                                {picked.card.collector_number}]
                            </div>
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <Label>Quantity</Label>
                        <Input
                            type='number'
                            min={1}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))}
                        />
                    </div>

                    <div className='space-y-2'>
                        <Label>Condition</Label>
                        <Select value={condition} onValueChange={(v) => setCondition(v as any)}>
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

                    <div className='space-y-2'>
                        <Label>Finish</Label>
                        <Select value={finish} onValueChange={(v) => setFinish(v as any)}>
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

                    <div className='space-y-2'>
                        <Label>Language</Label>
                        <Input
                            value={language}
                            onChange={(e) => setLanguage(e.target.value.toUpperCase())}
                            placeholder='EN'
                        />
                    </div>

                    <div className='space-y-2 sm:col-span-2'>
                        <Label>Pricing</Label>
                        <RadioGroup
                            className='flex gap-6'
                            value={priceMode}
                            onValueChange={(v) => setPriceMode(v as any)}
                        >
                            <label className='flex items-center gap-2'>
                                <RadioGroupItem value='fixed' id='pm-fixed' />
                                <span>Fixed</span>
                            </label>
                            <label className='flex items-center gap-2'>
                                <RadioGroupItem value='tcgplayer' id='pm-tcg' />
                                <span>TCGplayer (basis)</span>
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
                                <span className='text-sm text-muted-foreground'>
                                    PHP (you’ll convert externally)
                                </span>
                            </div>
                        ) : (
                            <div className='mt-2'>
                                <Select value={basis} onValueChange={(v) => setBasis(v as any)}>
                                    <SelectTrigger className='w-56'>
                                        <SelectValue placeholder='Basis' />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value='listed_median'>Listed median</SelectItem>
                                        <SelectItem value='market'>Market</SelectItem>
                                        <SelectItem value='high'>High</SelectItem>
                                        <SelectItem value='low'>Low</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className='mt-1 text-xs text-muted-foreground'>
                                    The final price can be computed server-side or on demand.
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='sm:col-span-2'>
                        <Button type='submit' disabled={saving}>
                            {saving ? 'Adding…' : 'Add to binder'}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    )
}
