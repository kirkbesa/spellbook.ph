// src/pages/binders/components/BinderCardsGrid.tsx
import * as React from 'react'
import type { BinderCard } from '@/hooks/binders/cardTypes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Layers, ImageOff, Pencil, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useRemoveBinderCard } from '@/hooks/binders/useRemoveBinderCard'
import { toast } from 'sonner'
import EditBinderCardModal from './EditBinderCardModal'

type Props = {
    items: BinderCard[]
    pageSize?: number
    onRemoved?: (id: string) => void
    refresh: () => void
    isOwner: boolean
}

/** Image section with Remove + Edit buttons for owners. */
function CardImage({
    src,
    alt,
    onRemoveClick,
    onEditClick, // NEW
    removing,
    isOwner,
}: {
    src?: string | null
    alt: string
    onRemoveClick?: () => void
    onEditClick?: () => void // NEW
    removing?: boolean
    isOwner: boolean
}) {
    const [broken, setBroken] = React.useState(false)
    const showFallback = !src || broken

    return (
        <div className='mb-2 rounded-xl w-full overflow-hidden relative'>
            {isOwner && (
                <div className='absolute right-2 top-2 z-10 flex flex-col gap-2'>
                    {onRemoveClick && (
                        <Button
                            variant='destructive'
                            size='icon'
                            className='h-7 w-7'
                            onClick={(e) => {
                                e.stopPropagation()
                                onRemoveClick()
                            }}
                            disabled={removing}
                            title='Remove from binder'
                        >
                            <X className='h-4 w-4' />
                        </Button>
                    )}
                    {onEditClick && (
                        <Button
                            variant='secondary'
                            size='icon'
                            className='h-7 w-7'
                            onClick={(e) => {
                                e.stopPropagation()
                                onEditClick()
                            }}
                            title='Edit listing'
                        >
                            <Pencil className='h-4 w-4' />
                        </Button>
                    )}
                </div>
            )}

            {showFallback ? (
                <div className='flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground'>
                    <ImageOff className='h-6 w-6' />
                    <span className='text-[11px]'>No image</span>
                </div>
            ) : (
                <img
                    src={src!}
                    alt={alt}
                    className='max-h-full max-w-full object-contain'
                    loading='lazy'
                    onError={() => setBroken(true)}
                />
            )}
        </div>
    )
}

export default function BinderCardsGrid({
    items,
    pageSize = 9,
    onRemoved,
    refresh,
    isOwner,
}: Props) {
    const { remove, removingId } = useRemoveBinderCard(onRemoved)

    const [pageIndex, setPageIndex] = React.useState(0)
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

    // NEW: edit modal state
    const [editItem, setEditItem] = React.useState<BinderCard | null>(null)

    React.useEffect(() => {
        if (pageIndex > totalPages - 1) setPageIndex(totalPages - 1)
    }, [items.length, pageSize, totalPages, pageIndex])

    const start = pageIndex * pageSize
    const end = start + pageSize
    const pageItems = items.slice(start, end)

    if (items.length === 0) {
        return (
            <div className='flex items-center justify-center rounded-md border p-10 text-sm text-muted-foreground'>
                No cards yet.
            </div>
        )
    }

    const PageControls = () => (
        <div className='flex items-center justify-end gap-2 text-sm'>
            <span className='text-muted-foreground'>
                Page {pageIndex + 1} of {totalPages}
            </span>
            <Button
                variant='outline'
                size='icon'
                className='h-8 w-8'
                onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                disabled={pageIndex === 0}
                title='Previous page'
            >
                <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
                variant='outline'
                size='icon'
                className='h-8 w-8'
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={pageIndex >= totalPages - 1}
                title='Next page'
            >
                <ChevronRight className='h-4 w-4' />
            </Button>
        </div>
    )

    return (
        <div className='space-y-3'>
            <PageControls />

            <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 items-stretch'>
                {pageItems.map((it) => {
                    const img = it.card?.image_normal ?? it.card?.image_small ?? ''
                    const name = it.card?.name ?? 'Unknown'
                    const setInfo = it.card
                        ? `[${it.card.set_code.toUpperCase()} · #${it.card.collector_number}]`
                        : ''
                    const setLogo = it.card?.set_icon_svg_uri ?? ''

                    const usdBase: number | null =
                        it.finish === 'foil'
                            ? (it.card?.scry_usd_foil ?? it.card?.scry_usd ?? null)
                            : it.finish === 'etched'
                              ? (it.card?.scry_usd_etched ??
                                it.card?.scry_usd_foil ??
                                it.card?.scry_usd ??
                                null)
                              : (it.card?.scry_usd ?? null)

                    let phpPrice: number | null = null
                    let usdPrice: number | null = null
                    if (it.price_mode === 'fixed') {
                        phpPrice = (it.display_price ?? it.fixed_price ?? 0) as number
                    } else {
                        if (it.price_currency === 'PHP') {
                            phpPrice = (it.display_price ?? it.computed_price ?? null) as
                                | number
                                | null
                            usdPrice = usdBase
                        } else {
                            usdPrice = (it.display_price ??
                                it.computed_price ??
                                usdBase ??
                                null) as number | null
                        }
                    }

                    const handleRemove = async () => {
                        if ((it.reserved_quantity ?? 0) > 0) {
                            toast.error('Cannot remove: reserved copies exist.')
                            return
                        }
                        if (!window.confirm('Remove this listing from your binder?')) return
                        try {
                            await remove(it.id)
                            toast.success('Removed')
                            refresh()
                        } catch (e) {
                            toast.error(e instanceof Error ? e?.message : 'Failed to remove')
                        }
                    }

                    return (
                        <div key={it.id} className='h-full'>
                            <div className='flex h-full flex-col rounded-lg bg-card p-2 transition-transform hover:scale-[1.01]'>
                                <CardImage
                                    src={img}
                                    alt={name}
                                    onRemoveClick={handleRemove}
                                    onEditClick={() => setEditItem(it)} // NEW
                                    removing={removingId === it.id}
                                    isOwner={isOwner}
                                />

                                <div className='flex justify-between gap-2'>
                                    <div className='min-w-0'>
                                        <div className='text-sm font-medium whitespace-normal break-words leading-snug'>
                                            {name}
                                        </div>
                                        <div className='text-xs text-muted-foreground whitespace-normal break-words'>
                                            {setInfo}
                                        </div>
                                    </div>
                                    {setLogo ? (
                                        <img
                                            src={setLogo}
                                            className='h-6 w-6 shrink-0'
                                            alt=''
                                            loading='lazy'
                                            onError={(e) =>
                                                ((
                                                    e.currentTarget as HTMLImageElement
                                                ).style.display = 'none')
                                            }
                                        />
                                    ) : null}
                                </div>

                                <div className='mt-auto' />

                                <div className='mt-2 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground'>
                                    <Badge
                                        variant='secondary'
                                        className={`px-2 py-0 text-[10px] ${
                                            it.finish === 'foil'
                                                ? 'bg-gradient-to-r from-blue-400 via-pink-500 to-yellow-500 text-white font-bold'
                                                : ''
                                        }`}
                                    >
                                        {it.finish.replace('_', ' ')}
                                    </Badge>
                                    <Badge variant='outline' className='px-1 py-0 text-[10px]'>
                                        {it.condition}
                                    </Badge>
                                    {it.language && (
                                        <Badge variant='outline' className='px-1 py-0 text-[10px]'>
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

                                <div className='mt-2 flex items-center justify-between text-md'>
                                    <span className='inline-flex items-center gap-1'>
                                        <Layers className='h-3.5 w-3.5' />
                                        {it.quantity}x
                                        {it.reserved_quantity ? (
                                            <span className='text-[10px] text-amber-700'>
                                                ({it.reserved_quantity} reserved)
                                            </span>
                                        ) : null}
                                    </span>

                                    <span className='truncate text-right leading-tight'>
                                        {phpPrice != null ? (
                                            <>
                                                <span className='font-semibold'>
                                                    ₱
                                                    {phpPrice.toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                                {it.price_mode === 'scryfall' && (
                                                    <span className='text-xs text-muted-foreground'>
                                                        {' '}
                                                        (x{it.fx_multiplier})
                                                    </span>
                                                )}
                                                {usdPrice != null && (
                                                    <div className='text-sm text-muted-foreground'>
                                                        $
                                                        {usdPrice.toLocaleString(undefined, {
                                                            minimumFractionDigits: 2,
                                                        })}{' '}
                                                        USD
                                                    </div>
                                                )}
                                            </>
                                        ) : it.price_mode === 'fixed' ? (
                                            <>
                                                ₱
                                                {(
                                                    it.display_price ??
                                                    it.fixed_price ??
                                                    0
                                                ).toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                })}
                                                <span className='text-[10px] text-muted-foreground'>
                                                    {' '}
                                                    (fixed)
                                                </span>
                                            </>
                                        ) : usdPrice != null ? (
                                            <>
                                                $
                                                {usdPrice.toLocaleString(undefined, {
                                                    minimumFractionDigits: 2,
                                                })}{' '}
                                                USD
                                                <div className='text-[10px] text-muted-foreground'>
                                                    set multiplier to show ₱
                                                </div>
                                            </>
                                        ) : (
                                            <span className='text-[10px] text-muted-foreground'>
                                                pricing…
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            <PageControls />

            {/* EDIT MODAL */}
            <EditBinderCardModal
                open={!!editItem}
                item={editItem}
                onClose={() => setEditItem(null)}
                onSaved={refresh}
            />
        </div>
    )
}
