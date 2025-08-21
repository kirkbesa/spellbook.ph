// src/pages/binders/components/BinderCardsGrid.tsx
import * as React from 'react'
import type { BinderCard } from '@/hooks/binders/cardTypes'
import { Badge } from '@/components/ui/badge'
import { Layers } from 'lucide-react'

type Props = {
    items: BinderCard[]
    pageSize?: number // defaults to 9 (3×3)
}

function chunk<T>(arr: T[], size: number) {
    const out: T[][] = []
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
    return out
}

export default function BinderCardsGrid({ items, pageSize = 9 }: Props) {
    const pages = chunk(items, pageSize)

    if (items.length === 0) {
        return (
            <div className='flex items-center justify-center rounded-md border p-10 text-sm text-muted-foreground'>
                No cards yet.
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            {pages.map((page, pi) => (
                <div key={pi} className='space-y-2'>
                    {pages.length > 1 && (
                        <div className='text-xs font-medium text-muted-foreground'>
                            Page {pi + 1}
                        </div>
                    )}

                    {/* 3x3 grid on sm+, 2 cols on mobile */}
                    <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
                        {page.map((it) => {
                            const img = it.card?.image_normal ?? it.card?.image_small ?? ''
                            const name = it.card?.name ?? 'Unknown'
                            const setInfo = it.card
                                ? `[${it.card.set_code.toUpperCase()} · #${it.card.collector_number}]`
                                : ''
                            const price =
                                it.price_mode === 'fixed'
                                    ? (it.fixed_price ?? 0)
                                    : (it.computed_price ?? 0)

                            return (
                                <div
                                    key={it.id}
                                    className='rounded-lg bg-card p-2 transition-transform hover:scale-[1.01]'
                                >
                                    {/* Image pocket */}
                                    <div className='relative mb-2 flex h-auto w-full items-center justify-center overflow-hidden rounded-lg border bg-white'>
                                        {img ? (
                                            <img
                                                src={img}
                                                alt={name}
                                                className='h-full w-auto object-cover'
                                                loading='lazy'
                                            />
                                        ) : (
                                            <div className='h-full w-full' />
                                        )}
                                    </div>

                                    {/* Title */}
                                    <div className='truncate text-sm font-medium'>{name}</div>
                                    <div className='truncate text-xs text-muted-foreground'>
                                        {setInfo}
                                    </div>

                                    {/* Tiny specs */}
                                    <div className='mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground'>
                                        <Badge
                                            variant='secondary'
                                            className='px-1 py-0 text-[10px]'
                                        >
                                            {it.finish.replace('_', ' ')}
                                        </Badge>
                                        <Badge variant='outline' className='px-1 py-0 text-[10px]'>
                                            {it.condition}
                                        </Badge>
                                        {it.language && (
                                            <Badge
                                                variant='outline'
                                                className='px-1 py-0 text-[10px]'
                                            >
                                                {it.language}
                                            </Badge>
                                        )}
                                        {it.listing_status !== 'available' && (
                                            <Badge
                                                variant='destructive'
                                                className='px-1 py-0 text-[10px]'
                                            >
                                                {it.listing_status}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Qty / Price */}
                                    <div className='mt-2 flex items-center justify-between text-xs'>
                                        <span className='inline-flex items-center gap-1'>
                                            <Layers className='h-3.5 w-3.5' />
                                            {it.quantity}
                                            {it.reserved_quantity ? (
                                                <span className='text-[10px] text-amber-700'>
                                                    ({it.reserved_quantity} reserved)
                                                </span>
                                            ) : null}
                                        </span>
                                        <span className='truncate'>
                                            {it.price_mode === 'fixed' ? (
                                                <>
                                                    ₱
                                                    {price.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                    <span className='text-[10px] text-muted-foreground'>
                                                        {' '}
                                                        (fixed)
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    ₱
                                                    {price.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                    <span className='text-[10px] text-muted-foreground'>
                                                        {' '}
                                                        (tcg: {it.tcg_basis})
                                                    </span>
                                                </>
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    )
}
