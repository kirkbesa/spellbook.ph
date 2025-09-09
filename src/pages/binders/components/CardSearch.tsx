// src/pages/binders/components/CardSearch.tsx
import * as React from 'react'
import type { SearchResult } from '@/hooks/cards/useCardSearch'
import { cn } from '@/lib/utils' // if you have a classnames helper
import { Loader2 } from 'lucide-react'

type Props = {
    value: string
    onChange: (v: string) => void
    loading: boolean
    results: SearchResult[]
    onPick: (r: SearchResult) => void
    placeholder?: string
}

export default function CardSearch({
    value,
    onChange,
    loading,
    results,
    onPick,
    placeholder,
}: Props) {
    const [open, setOpen] = React.useState(false)
    const [hoverIndex, setHoverIndex] = React.useState<number>(-1)
    const wrapRef = React.useRef<HTMLDivElement | null>(null)
    const listRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
        setOpen(value.length > 0)
    }, [value])

    // close when clicking outside
    React.useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onDoc)
        return () => document.removeEventListener('mousedown', onDoc)
    }, [])

    // keyboard navigation
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!open || results.length === 0) return
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHoverIndex((i) => Math.min(results.length - 1, i + 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHoverIndex((i) => Math.max(0, i - 1))
        } else if (e.key === 'Enter') {
            e.preventDefault()
            const r = results[hoverIndex] ?? results[0]
            if (r) {
                onPick(r)
                setOpen(false)
            }
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    return (
        <div ref={wrapRef} className='relative'>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => value && setOpen(true)}
                onKeyDown={onKeyDown}
                className='w-full rounded-md border px-3 py-2 text-sm pr-8'
                placeholder={placeholder ?? 'Search cards (name)…'}
                autoComplete='off'
            />
            {loading && (
                <Loader2 className='absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground' />
            )}

            {open && (
                <div
                    ref={listRef}
                    className='absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md'
                    onMouseLeave={() => setHoverIndex(-1)}
                >
                    <div className='grid grid-cols-[1fr_auto]'>
                        <div className='max-h-80 overflow-auto'>
                            {loading ? (
                                <div className='px-3 py-2 text-sm text-muted-foreground'>
                                    Loading cards...
                                </div>
                            ) : results.length === 0 ? (
                                <div className='px-3 py-2 text-sm text-muted-foreground'>
                                    No results
                                </div>
                            ) : (
                                results.map((r, idx) => (
                                    <div
                                        key={`${r.source}-${r.card.scryfall_id}`}
                                        className={cn(
                                            'flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm',
                                            idx === hoverIndex ? 'bg-accent' : ''
                                        )}
                                        onMouseEnter={() => setHoverIndex(idx)}
                                        // prevent input from losing focus while clicking item
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            onPick(r)
                                            setOpen(false)
                                        }}
                                    >
                                        <div className='flex items-center gap-2 min-w-0'>
                                            {r.card.set_icon_svg_uri && (
                                                <img
                                                    src={r.card.set_icon_svg_uri}
                                                    className='inline-block h-8 w-8 align-text-bottom mr-1'
                                                />
                                            )}
                                            <div className='truncate'>
                                                {r.card.name}{' '}
                                                <span className='text-muted-foreground'>
                                                    [{r.card.set_code.toUpperCase()} · #
                                                    {r.card.collector_number}]
                                                </span>
                                            </div>
                                            {/* <div className='text-[10px] text-muted-foreground'>
                                                {r.source === 'db' ? 'In Spellbook' : 'Scryfall'}
                                            </div> */}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Hover preview panel */}
                        <div className='hidden min-h-[12rem] w-70 items-center justify-center border-l p-2 sm:flex'>
                            {results[hoverIndex]?.card.image_normal ? (
                                <img
                                    src={results[hoverIndex]!.card.image_normal!}
                                    alt={results[hoverIndex]!.card.name}
                                    className='h-auto w-full rounded-md border object-cover'
                                />
                            ) : (
                                <div className='h-auto w-full rounded-md border bg-muted' />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
