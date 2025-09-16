// src/pages/binders/components/BinderTile.tsx
import { Link } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BadgeCheckIcon, Layers, MapPin } from 'lucide-react'
import type { Binder } from './LatestBinders'

type Props = {
    binder: Binder
}

export default function LatestBinderTile({ binder }: Props) {
    const cover = binder.image_url || ''

    let ownerName = binder.users.username ?? ''
    if (binder.users.first_name) {
        if (binder.users.last_name) {
            ownerName = binder.users.first_name + ' ' + binder.users.last_name
        } else {
            ownerName = binder.users.first_name
        }
    }

    return (
        <Link
            to='/binders/$binderId'
            params={{ binderId: binder.id }}
            className='flex-col flex gap-4'
        >
            <Card className='py-0 gap-0 flex h-full flex-col overflow-hidden transition-transform hover:scale-[1.02]'>
                {/* Cover art */}
                <div className='relative w-full h-30 overflow-hidden rounded-t-lg'>
                    {cover ? (
                        <>
                            <img
                                src={cover}
                                alt=''
                                className='h-auto w-full object-cover object-[50%_25%]'
                                loading='lazy'
                                onError={(e) => {
                                    // hide image if it fails, revert to plain background
                                    ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                                }}
                            />
                            {/* Bottom gradient to background */}
                            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-neutral-950' />
                        </>
                    ) : (
                        <div className='h-full w-full bg-background' />
                    )}
                </div>

                {/* Details */}
                <div className='flex flex-1 flex-col p-3'>
                    <div className='mb-1 flex items-center gap-2'>
                        <div className='truncate font-medium'>{binder.name}</div>
                        <Badge variant='outline' className='shrink-0'>
                            {binder.privacy.charAt(0).toUpperCase() + binder.privacy.slice(1)}
                        </Badge>

                        {/* Match information - only show if search results */}
                        {binder.binder_cards.length > 0 && (
                            <div className='flex items-center gap-2 text-sm font-medium text-green-600'>
                                <span>{binder.binder_cards.length} new cards!</span>
                            </div>
                        )}
                    </div>

                    <div className='flex items-center gap-2 text-xs text-muted-foreground mb-4'>
                        <Layers size={14} />
                        <span className='truncate'>
                            {binder.card_count ?? 0}{' '}
                            {(binder.card_count ?? 0) === 1 ? 'card' : 'cards'}
                        </span>
                    </div>

                    {/* Owner information */}
                    <div className='flex flex-row items-center gap-4 mt-auto'>
                        {binder.users ? (
                            <Link to='/u/$userId' params={{ userId: binder.users.id }}>
                                <div className='flex items-center gap-3'>
                                    {/* Avatar */}
                                    <div className='relative h-8 w-8 overflow-hidden rounded-full border bg-muted'>
                                        {binder.users.image_url && (
                                            <img
                                                src={binder.users.image_url}
                                                alt='Owner avatar'
                                                className='h-full w-full object-cover'
                                                draggable={false}
                                            />
                                        )}
                                    </div>

                                    {/* Name + location */}
                                    <div className='min-w-0'>
                                        <div className='flex items-center space-x-1 truncate text-sm font-medium'>
                                            <span className='truncate'>{ownerName}</span>
                                            {binder.users.isverified && (
                                                <BadgeCheckIcon
                                                    className='text-blue-500'
                                                    size={16}
                                                />
                                            )}
                                        </div>
                                        <div className='flex items-center gap-1 truncate text-xs text-muted-foreground'>
                                            <MapPin size={12} />
                                            <span className='truncate'>
                                                {binder.users.location ?? 'No location'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            // Fallback skeleton when owner not loaded yet
                            <div className='flex items-center gap-3'>
                                <div className='h-10 w-10 animate-pulse rounded-full bg-muted' />
                                <div className='h-4 w-28 animate-pulse rounded bg-muted' />
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    )
}
