// src/pages/binders/components/BinderHeader.tsx
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { BadgeCheckIcon, MapPin, MessageSquare } from 'lucide-react'
import type { Binder } from '@/hooks/binders/types'
import { usePublicUser } from '@/hooks/users/usePublicUser'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { startConversationByUsername } from '@/hooks/chat/useStartConversation'

type Props = {
    binder: Binder
    isOwner?: boolean
}

export default function BinderHeader({ binder, isOwner }: Props) {
    const { user: owner, loading } = usePublicUser(binder.owner_id)
    const navigate = useNavigate()
    const [starting, setStarting] = React.useState(false)

    const ownerName = React.useMemo(() => {
        if (!owner) return '—'
        const full = [owner.first_name ?? '', owner.last_name ?? ''].filter(Boolean).join(' ')
        return full || owner.username || '—'
    }, [owner])

    const isVerified = owner?.isverified ?? false

    const onMessage = React.useCallback(async () => {
        try {
            setStarting(true)
            if (owner?.username) {
                // Start or fetch the conversation by username
                await startConversationByUsername(owner.username)
            }
            // Navigate to chats (your Chats page will pick most recent or already-open conversation)
            navigate({ to: '/chats' })
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to open chat'
            toast.error(msg)
        } finally {
            setStarting(false)
        }
    }, [owner?.username, navigate])

    return (
        <div className='flex flex-col'>
            {/* Binder Art Cover */}
            {binder.image_url && (
                <div className='relative mb-4 h-50 w-full overflow-hidden rounded-t-lg'>
                    <img
                        src={binder.image_url}
                        alt=''
                        className='h-full w-full object-cover object-[50%_20%]'
                    />
                    <div className='pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-neutral-950' />
                </div>
            )}

            {/* Details */}
            <div className='flex items-center justify-between gap-4 border-b pb-4'>
                {/* Left: binder basics */}
                <div className='flex flex-col'>
                    <div className='flex items-center gap-3'>
                        <div className='flex flex-row gap-4'>
                            <h1 className='text-xl font-semibold'>{binder.name}</h1>
                            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                <Badge variant='secondary'>{binder.privacy}</Badge>
                            </div>
                        </div>
                    </div>
                    {binder.description ? (
                        <div className='mt-1 line-clamp-2 whitespace-pre-wrap break-words text-xs text-muted-foreground'>
                            {binder.description}
                        </div>
                    ) : null}
                </div>

                {/* Right: owner + message button */}
                <div className='flex flex-row items-center gap-4'>
                    {owner ? (
                        <Link to='/u/$userId' params={{ userId: owner.id }}>
                            <div className='flex items-center gap-3'>
                                {/* Avatar */}
                                <div className='relative h-10 w-10 overflow-hidden rounded-full border bg-muted'>
                                    {loading && (
                                        <div className='absolute inset-0 animate-pulse bg-muted/60' />
                                    )}
                                    {owner.image_url && (
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
                                    <div className='flex items-center space-x-1 truncate text-sm font-medium'>
                                        <span className='truncate'>{ownerName}</span>
                                        {isVerified && (
                                            <BadgeCheckIcon className='text-blue-500' size={16} />
                                        )}
                                    </div>
                                    {owner.location && (
                                        <div className='flex items-center gap-1 truncate text-xs text-muted-foreground'>
                                            <MapPin size={12} />
                                            <span className='truncate'>{owner.location}</span>
                                        </div>
                                    )}
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

                    {!isOwner && (
                        <div className='sm:ml-auto'>
                            <Button
                                onClick={onMessage}
                                disabled={starting || !owner}
                                variant={'secondary'}
                                title='Message owner'
                                className='inline-flex items-center gap-2'
                            >
                                <MessageSquare size={16} />
                                <span className='hidden sm:inline'>Message</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
