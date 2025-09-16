import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { MapPin, MessageCircleWarning, MessageSquare, Star } from 'lucide-react'
import { startConversationByUsername } from '@/hooks/chat/useStartConversation'
import { toast } from 'sonner'
import VerifiedBadge from '@/components/layout/VerifiedBadge'
import PublicReviews from './components/PublicReviews'
import RateModal from './components/RateModal'
// import ReportModal from './components/ReportModal' TODO: Reporting Feature
import { useState } from 'react'

type Profile = {
    id: string
    username: string | null
    first_name: string | null
    last_name: string | null
    location: string | null
    image_url: string | null
    isverified: boolean | null
    reputation: number
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

    const displayName = [profile.first_name ?? '', profile.last_name ?? '']
        .filter(Boolean)
        .join(' ')
    const nameOrUsername = (displayName || profile.username || '—').trim()

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

    const [isRateModalOpen, setIsRateModalOpen] = useState<boolean>(false)
    // Todo: Reporting Feature
    // const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false)

    return (
        <div className='mx-auto w-full max-w-6xl space-y-6'>
            {/* Header */}
            <section className='rounded-lg border p-4'>
                <div className='flex gap-4 sm:flex-row items-center'>
                    <div className='h-16 w-16 overflow-hidden rounded-full border bg-muted shrink-0'>
                        {profile.image_url && (
                            <img
                                src={profile.image_url}
                                alt={`${nameOrUsername} avatar`}
                                className='h-full w-full object-cover'
                                onError={(e) =>
                                    ((e.currentTarget as HTMLImageElement).style.display = 'none')
                                }
                            />
                        )}
                    </div>

                    <div className='min-w-0 flex-1'>
                        <div className='flex items-center gap-2'>
                            <h1 className='truncate text-xl font-semibold'>{nameOrUsername}</h1>
                            <VerifiedBadge isVerified={isVerified} />
                        </div>
                        <div className='mt-1 flex md:flex-row flex-col md:items-center gap-1 md:gap-4 text-sm text-muted-foreground'>
                            {profile.username && <span>@{profile.username}</span>}
                            <span className='inline-flex items-center gap-1'>
                                <MapPin size={14} />
                                {profile.location ?? 'No Location'}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 ${profile.reputation >= 0 ? 'text-amber-500' : 'text-red-500'}`}
                            >
                                <Star size={14} />
                                {profile.reputation ?? 0} rep
                            </span>
                        </div>
                    </div>

                    {!isMe && (
                        <>
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
                            <div className='sm:ml-auto'>
                                <Button
                                    onClick={() => {
                                        setIsRateModalOpen(true)
                                    }}
                                    className='inline-flex items-center gap-2 text-amber-600 bg-amber-200 hover:bg-amber-300 hover:text-amber-700'
                                >
                                    <Star size={16} />
                                    <span className='hidden sm:flex'>Rate</span>
                                </Button>
                            </div>
                            <div className='sm:ml-auto'>
                                <Button
                                    onClick={() => {}}
                                    className='inline-flex items-center gap-2 text-white bg-red-500 hover:bg-red-700'
                                >
                                    <MessageCircleWarning size={16} />
                                    <span className='hidden sm:flex'>Report</span>
                                </Button>
                            </div>
                        </>
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

            {/* Public Reviews */}
            <PublicReviews user_id={profile.id} />

            {isRateModalOpen && (
                <RateModal
                    reviewer_id={currentUserId}
                    reviewee_id={profile.id}
                    setOpen={setIsRateModalOpen}
                />
            )}
            {/* TODO: Reporting feature */}
            {/* {isReportModalOpen && <ReportModal />} */}
        </div>
    )
}
