// src/pages/binders/components/BinderTile.tsx
import { Link } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Layers, Cog } from 'lucide-react'

type BinderLike = {
    id: string
    name: string
    privacy: 'public' | 'unlisted' | 'private'
    image_url?: string | null
    card_count?: number
}

type Props = { binder: BinderLike }

export default function BinderTile({ binder }: Props) {
    const cover = binder.image_url || ''

    return (
        <Link to='/binders/$binderId' params={{ binderId: binder.id }}>
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
                    </div>

                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                        <Layers size={14} />
                        <span className='truncate'>
                            {binder.card_count ?? 0}{' '}
                            {(binder.card_count ?? 0) === 1 ? 'card' : 'cards'}
                        </span>
                    </div>

                    <div className='mt-auto flex items-center justify-end gap-2 pt-3'>
                        <Link
                            to='/binders/$binderId/settings'
                            params={{ binderId: binder.id }}
                            className='inline-flex'
                        >
                            <button className='flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-accent'>
                                <Cog size={16} />
                                <span>Settings</span>
                            </button>
                        </Link>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
