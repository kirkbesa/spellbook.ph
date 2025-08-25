// src/pages/binders/components/BinderHeader.tsx
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { MapPin } from 'lucide-react'
import type { Binder } from '@/hooks/binders/types'
import { usePublicUser } from '@/hooks/users/usePublicUser'

type Props = {
    binder: Binder
    isOwner?: boolean
}

export default function BinderHeader({ binder }: Props) {
    const { user: owner, loading } = usePublicUser(binder.owner_id)

    const ownerName = React.useMemo(() => {
        if (!owner) return '—'
        const full = [owner.first_name ?? '', owner.last_name ?? ''].filter(Boolean).join(' ')
        return full || owner.username || '—'
    }, [owner])

    return (
        <div className='flex flex-col'>
            {/* Binder Art Cover */}
            {binder.image_url && (
                <div className='relative w-full h-50 overflow-hidden mb-4 rounded-t-lg'>
                    <img
                        src={binder.image_url}
                        alt=''
                        className='h-full w-full object-cover object-[50%_25%]'
                    />
                    {/* bottom fade → white (use background for dark mode if you want) */}
                    <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-neutral-950' />
                </div>
            )}

            {/* Details */}
            <div className='flex items-center justify-between gap-4 border-b pb-4'>
                {/* Left: binder basics (kept as-is) */}
                <div className='flex items-center gap-3'>
                    {/* <FolderClosed color={binder.color_hex ?? '#000000'} size={60} /> */}
                    <div className='flex flex-row gap-4'>
                        <h1 className='text-xl font-semibold'>{binder.name}</h1>
                        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <Badge variant='secondary'>{binder.privacy}</Badge>
                        </div>
                    </div>
                </div>

                {/* Right: owner chip (avatar, name, location only) */}
                <div className='flex items-center gap-3'>
                    {/* Avatar */}
                    <div className='relative h-10 w-10 overflow-hidden rounded-full border bg-muted'>
                        {/* simple loading shimmer */}
                        {loading && <div className='absolute inset-0 animate-pulse bg-muted/60' />}
                        {owner?.image_url && (
                            <img
                                src={owner.image_url}
                                alt='Owner avatar'
                                className='h-full w-full object-cover'
                                draggable={false}
                            />
                        )}
                    </div>

                    {/* Name + location */}
                    <div className='min-w-0'>
                        <div className='truncate text-sm font-medium'>{ownerName}</div>
                        {owner?.location && (
                            <div className='flex items-center gap-1 truncate text-xs text-muted-foreground'>
                                <MapPin size={12} />
                                <span className='truncate'>{owner.location}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
