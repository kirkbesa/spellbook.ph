import * as React from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, BadgeCheck, MessageSquare } from 'lucide-react'
import { startConversationByUsername } from '@/hooks/chat/useStartConversation'
import { toast } from 'sonner'

type Profile = {
    id: string
    username: string | null
    first_name: string | null
    last_name: string | null
    location: string | null
    image_url: string | null
    isverified: boolean | null
}

type BinderSummary = {
    id: string
    owner_id: string
    name: string
    description: string | null
    color_hex: string | null
    pocket_layout: number | null
    image_url: string | null
    privacy: 'public' | 'unlisted' | 'private'
    created_at: string
    updated_at: string
    card_count: number
}

export default function PublicUserProfilePage({
    profile,
    binders,
    currentUserId,
}: {
    profile: Profile
    binders: BinderSummary[]
    currentUserId: string
}) {
    const navigate = useNavigate()
    const fullName = React.useMemo(() => {
        const first = profile.first_name ?? ''
        const last = profile.last_name ?? ''
        const full = [first, last].filter(Boolean).join(' ')
        return full || profile.username || '—'
    }, [profile])

    const isMe = currentUserId === profile.id
    const isVerified = !!profile.isverified

    const onMessage = async () => {
        if (!profile.username) return toast.error('This user has no username set.')
        try {
            await startConversationByUsername(profile.username)
            navigate({ to: '/chats' })
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to start conversation')
        }
    }

    return (
        <div className='mx-auto w-full max-w-5xl space-y-6'>
            {/* Header */}
            <section className='rounded-lg border p-4'>
                <div className='flex gap-4 sm:flex-row items-center'>
                    <div className='h-16 w-16 overflow-hidden rounded-full border bg-muted shrink-0'>
                        {profile.image_url && (
                            <img
                                src={profile.image_url}
                                alt={`${fullName} avatar`}
                                className='h-full w-full object-cover'
                                onError={(e) =>
                                    ((e.currentTarget as HTMLImageElement).style.display = 'none')
                                }
                            />
                        )}
                    </div>

                    <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                            <h1 className='truncate text-xl font-semibold'>{fullName}</h1>
                            {!isVerified && (
                                <>
                                    <Badge className='hidden sm:flex gap-1 bg-blue-500 text-white dark:bg-blue-600'>
                                        <BadgeCheck size={14} />
                                        <span className=''>Verified</span>
                                    </Badge>
                                    <BadgeCheck className='w-5 h-5 text-blue-500 sm:hidden' />
                                </>
                            )}
                        </div>
                        {profile.username && (
                            <div className='text-sm text-muted-foreground'>@{profile.username}</div>
                        )}
                        {profile.location && (
                            <div className='mt-1 flex items-center gap-1 text-xs text-muted-foreground'>
                                <MapPin size={12} />
                                <span className='truncate'>{profile.location}</span>
                            </div>
                        )}
                    </div>

                    {!isMe && (
                        <div className='sm:ml-auto'>
                            <Button
                                onClick={onMessage}
                                variant={'secondary'}
                                className='inline-flex items-center gap-2'
                            >
                                <MessageSquare size={16} />
                                <span className='hidden sm:flex'>Message</span>
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Public binders */}
            <section className='space-y-3'>
                <h2 className='text-lg font-semibold'>Public Binders</h2>

                <div className='rounded-lg'>
                    {binders.length === 0 ? (
                        <div className='text-sm text-muted-foreground'>No public binders.</div>
                    ) : (
                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                            {binders.map((b) => (
                                <Link
                                    key={b.id}
                                    to='/binders/$binderId'
                                    params={{ binderId: b.id }}
                                    className='block rounded-lg border transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                >
                                    <div className='flex h-full flex-col'>
                                        <div className='relative h-28 w-full overflow-hidden rounded-t-lg'>
                                            {b.image_url ? (
                                                <img
                                                    src={b.image_url}
                                                    alt=''
                                                    className='h-full w-full object-cover'
                                                    onError={(e) =>
                                                        ((
                                                            e.currentTarget as HTMLImageElement
                                                        ).style.display = 'none')
                                                    }
                                                />
                                            ) : (
                                                <div
                                                    className='h-full w-full'
                                                    style={{
                                                        background: b.color_hex || 'transparent',
                                                    }}
                                                />
                                            )}
                                            <div className='pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-background' />
                                        </div>

                                        <div className='flex flex-1 flex-col gap-1 p-3'>
                                            <div className='truncate font-medium'>{b.name}</div>
                                            {b.description && (
                                                <div className='text-xs text-muted-foreground line-clamp-2'>
                                                    {b.description}
                                                </div>
                                            )}
                                            <div className='mt-auto flex items-center justify-between text-xs text-muted-foreground'>
                                                <span className='capitalize'>{b.privacy}</span>
                                                <span>{b.card_count} cards</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
