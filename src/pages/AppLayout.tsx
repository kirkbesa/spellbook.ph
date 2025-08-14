// src/pages/AppLayout.tsx
import * as React from 'react'
import LogoutButton from '@/components/layout/LogoutButton'
import { Outlet } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, Minus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import Loading from '@/components/layout/Loading'

type ScryfallImageUris = {
    small?: string
    normal?: string
    large?: string
    png?: string
}

type ScryfallCard = {
    id: string
    name: string
    set: string
    set_name: string
    collector_number: string
    image_uris?: ScryfallImageUris
    prices?: {
        usd?: string | null
        usd_foil?: string | null
        usd_etched?: string | null
        eur?: string | null
    }
    card_faces?: Array<{
        name?: string
        image_uris?: ScryfallImageUris
    }>
}

type BinderItem = {
    id: string
    name: string
    set: string
    set_name: string
    collector_number: string
    image: string
    priceUsd: number
    quantity: number
}

const getCardImage = (c: ScryfallCard): string => {
    // prefer 'normal'; fallback chain includes DFC face[0]
    return (
        c.image_uris?.normal ||
        c.image_uris?.large ||
        c.card_faces?.[0]?.image_uris?.normal ||
        c.card_faces?.[0]?.image_uris?.large ||
        ''
    )
}

const parseUsd = (c: ScryfallCard): number => {
    // Scryfall prices.usd maps to TCGplayer Market USD
    const p = c.prices?.usd
    const n = p ? Number(p) : 0
    return Number.isFinite(n) ? n : 0
}

const useDebouncedValue = <T,>(value: T, delay = 250) => {
    const [debounced, setDebounced] = React.useState(value)
    React.useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(t)
    }, [value, delay])
    return debounced
}

const ScryfallSearchBinder: React.FC = () => {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')
    const debouncedQuery = useDebouncedValue(query, 250)

    const [loading, setLoading] = React.useState(false)
    const [suggestions, setSuggestions] = React.useState<ScryfallCard[]>([])
    const [binder, setBinder] = React.useState<BinderItem[]>([])

    React.useEffect(() => {
        const run = async () => {
            const q = debouncedQuery.trim()
            if (!q) {
                setSuggestions([])
                return
            }
            setLoading(true)
            try {
                // Using Scryfall search; keep it lightweight and unique-ish
                const url = new URL('https://api.scryfall.com/cards/search')
                url.searchParams.set('q', q)
                url.searchParams.set('unique', 'prints')
                url.searchParams.set('order', 'relevance')
                url.searchParams.set('include_extras', 'false')
                url.searchParams.set('include_variations', 'false')

                const res = await fetch(url.toString())
                if (!res.ok) throw new Error('Scryfall search failed')
                const data = await res.json()
                const cards: ScryfallCard[] = Array.isArray(data.data) ? data.data : []
                setSuggestions(cards.slice(0, 50)) // limit suggestions
            } catch (e) {
                console.error(e)
                setSuggestions([])
            } finally {
                setLoading(false)
            }
        }
        run()
    }, [debouncedQuery])

    const addToBinder = (card: ScryfallCard) => {
        const img = getCardImage(card)
        const priceUsd = parseUsd(card)
        setBinder((prev) => {
            const idx = prev.findIndex((it) => it.id === card.id)
            if (idx >= 0) {
                const copy = [...prev]
                copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 }
                return copy
            }
            const item: BinderItem = {
                id: card.id,
                name: card.name,
                set: card.set,
                set_name: card.set_name,
                collector_number: card.collector_number,
                image: img,
                priceUsd,
                quantity: 1,
            }
            return [item, ...prev]
        })
        setOpen(false)
        setQuery('')
        setSuggestions([])
    }

    const changeQty = (id: string, delta: number) => {
        setBinder((prev) =>
            prev
                .map((it) =>
                    it.id === id ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it
                )
                .sort((a, b) => a.name.localeCompare(b.name))
        )
    }

    const setQty = (id: string, q: number) => {
        setBinder((prev) =>
            prev.map((it) => (it.id === id ? { ...it, quantity: Math.max(1, q) } : it))
        )
    }

    const removeItem = (id: string) => {
        setBinder((prev) => prev.filter((it) => it.id !== id))
    }

    const totalUsd = binder.reduce((sum, it) => sum + it.priceUsd * it.quantity, 0)

    return (
        <div className='w-full space-y-6'>
            <div className='flex flex-col gap-2'>
                <h2 className='text-2xl font-semibold tracking-tight'>Binder Builder (Demo)</h2>
                <p className='text-sm text-muted-foreground'>
                    Search cards via Scryfall, preview on hover, add to the binder. Quantities and
                    delete are supported. Prices use Scryfall’s USD (TCG Market) for now.
                </p>
            </div>

            {/* Search with suggestions + hover previews */}
            <div className='w-full'>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <div className='relative w-full'>
                            <Input
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value)
                                    setOpen(true)
                                }}
                                placeholder='Search Magic cards… e.g., Sol Ring, Lightning Bolt, Sheoldred'
                                className='pl-10'
                            />
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                        </div>
                    </PopoverTrigger>
                    <PopoverContent align='start' className='p-0 w-[560px]'>
                        <Command shouldFilter={false}>
                            <CommandInput
                                placeholder='Type to search…'
                                value={query}
                                onValueChange={(v) => setQuery(v)}
                            />
                            <CommandList>
                                {loading ? (
                                    <div className='px-3 py-4 text-sm text-muted-foreground'>
                                        Searching…
                                    </div>
                                ) : (
                                    <>
                                        <CommandEmpty>No results.</CommandEmpty>
                                        <ScrollArea className='max-h-[400px]'>
                                            <CommandGroup heading='Results'>
                                                {suggestions.map((c) => {
                                                    const img = getCardImage(c)
                                                    return (
                                                        <HoverCard
                                                            openDelay={100}
                                                            closeDelay={100}
                                                            key={c.id}
                                                        >
                                                            <HoverCardTrigger asChild>
                                                                <CommandItem
                                                                    className='cursor-pointer'
                                                                    onSelect={() => addToBinder(c)}
                                                                >
                                                                    <div className='flex items-center gap-3'>
                                                                        <div className='flex flex-col'>
                                                                            <span className='font-medium'>
                                                                                {c.name}
                                                                            </span>
                                                                            <span className='text-xs text-muted-foreground'>
                                                                                {c.set.toUpperCase()}{' '}
                                                                                • {c.set_name} • #
                                                                                {c.collector_number}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className='ml-auto text-xs text-muted-foreground'>
                                                                        ${parseUsd(c).toFixed(2)}
                                                                    </div>
                                                                </CommandItem>
                                                            </HoverCardTrigger>
                                                            <HoverCardContent
                                                                className='w-auto p-2'
                                                                side='right'
                                                                align='start'
                                                            >
                                                                {img ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={img}
                                                                        alt={c.name}
                                                                        className='h-64 w-auto rounded-md shadow'
                                                                    />
                                                                ) : (
                                                                    <div className='text-sm text-muted-foreground'>
                                                                        No image available
                                                                    </div>
                                                                )}
                                                            </HoverCardContent>
                                                        </HoverCard>
                                                    )
                                                })}
                                            </CommandGroup>
                                        </ScrollArea>
                                    </>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Binder grid */}
            <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>Sample Binder</h3>
                <Badge variant='secondary'>
                    {binder.length} item{binder.length !== 1 ? 's' : ''}
                </Badge>
            </div>

            {binder.length === 0 ? (
                <div className='text-sm text-muted-foreground'>
                    Your binder is empty. Search above and click a result to add it.
                </div>
            ) : (
                <>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
                        {binder.map((it) => (
                            <Card key={it.id} className='overflow-hidden'>
                                <CardHeader className='pb-2'>
                                    <CardTitle className='text-base'>{it.name}</CardTitle>
                                    <div className='text-xs text-muted-foreground'>
                                        {it.set.toUpperCase()} • {it.set_name} • #
                                        {it.collector_number}
                                    </div>
                                </CardHeader>
                                <CardContent className='pt-0'>
                                    <div className='flex gap-3'>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={it.image}
                                            alt={it.name}
                                            className='h-40 w-auto rounded-md border'
                                        />
                                        <div className='flex flex-col justify-between py-1'>
                                            <div className='space-y-1'>
                                                <div className='text-sm'>
                                                    Unit:{' '}
                                                    <span className='font-medium'>
                                                        ${it.priceUsd.toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className='text-sm'>
                                                    Subtotal:{' '}
                                                    <span className='font-semibold'>
                                                        ${(it.priceUsd * it.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Button
                                                    type='button'
                                                    size='icon'
                                                    variant='outline'
                                                    onClick={() => changeQty(it.id, -1)}
                                                >
                                                    <Minus className='h-4 w-4' />
                                                </Button>
                                                <Input
                                                    aria-label='Quantity'
                                                    inputMode='numeric'
                                                    className='w-16 text-center'
                                                    value={it.quantity}
                                                    onChange={(e) => {
                                                        const n = Number(
                                                            e.target.value.replace(/[^\d]/g, '')
                                                        )
                                                        if (Number.isFinite(n) && n > 0)
                                                            setQty(it.id, n)
                                                    }}
                                                />
                                                <Button
                                                    type='button'
                                                    size='icon'
                                                    variant='outline'
                                                    onClick={() => changeQty(it.id, +1)}
                                                >
                                                    <Plus className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className='justify-between'>
                                    <div className='text-sm text-muted-foreground'>
                                        ${(it.priceUsd * it.quantity).toFixed(2)} total
                                    </div>
                                    <Button
                                        type='button'
                                        variant='destructive'
                                        size='sm'
                                        onClick={() => removeItem(it.id)}
                                    >
                                        <Trash2 className='mr-2 h-4 w-4' />
                                        Remove
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <div className='flex items-center justify-end gap-4'>
                        <div className='text-sm text-muted-foreground'>Binder total</div>
                        <div className='text-xl font-semibold'>${totalUsd.toFixed(2)}</div>
                    </div>
                </>
            )}
        </div>
    )
}

const AppLayout = () => {
    return (
        <div className='w-full min-h-screen flex flex-col gap-6 items-center py-8'>
            <div className='text-xs text-muted-foreground'>src/pages/AppLayout.tsx</div>
            <LogoutButton />
            <div className='w-full flex items-center justify-center px-4'>
                <ScryfallSearchBinder />
            </div>
            <Outlet />
        </div>
    )
}

export default AppLayout
