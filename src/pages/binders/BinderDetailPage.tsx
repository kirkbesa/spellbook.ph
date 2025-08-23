// src/pages/binders/BinderDetailPage.tsx
import type { Binder } from '@/hooks/binders/types'
import BinderHeader from './components/BinderHeader'
import BackButton from '@/components/common/BackButton'
import ShareLinkButton from '@/components/common/ShareLinkButton'
import { Link } from '@tanstack/react-router'
import { Cog } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AddCardPanel from './components/AddCardPanel'
import { useBinderCards } from '@/hooks/binders/useBinderCards'
import { SpinnerCentered } from '@/components/common/Spinner'
import BinderCardsGrid from './components/BinderCardsGrid'

type Props = {
    binder: Binder
    currentUserId?: string | null
}

export default function BinderDetailPage({ binder, currentUserId }: Props) {
    const isOwner = currentUserId === binder.owner_id
    const { cards, loading, error, refresh } = useBinderCards(binder.id)

    return (
        <div className='mx-auto w-full max-w-5xl space-y-6'>
            <div className='flex items-center justify-between'>
                <BackButton fallbackTo='/binders' />
                <div className='flex items-center gap-2'>
                    {isOwner && (
                        <Link
                            to='/binders/$binderId/settings'
                            params={{ binderId: binder.id }}
                            className='inline-flex'
                        >
                            <Button
                                size='sm'
                                variant='ghost'
                                className='flex items-center gap-2 rounded-md border px-2.5 py-1.5 hover:bg-accent'
                            >
                                <Cog size={16} />
                                <span>Settings</span>
                            </Button>
                        </Link>
                    )}
                    <ShareLinkButton
                        disabled={binder.privacy === 'private'}
                        disabledHint='Make this binder public to share'
                    />
                </div>
            </div>

            <BinderHeader binder={binder} isOwner={isOwner} />

            {isOwner && <AddCardPanel binderId={binder.id} onAdded={refresh} />}

            <section className='space-y-3 rounded-lg border p-4'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-lg font-semibold'>Cards</h2>
                </div>

                {loading ? (
                    <SpinnerCentered label='Loading cards…' size='md' />
                ) : error ? (
                    <p className='text-sm text-red-500'>{error}</p>
                ) : (
                    <BinderCardsGrid items={cards} refresh={refresh} isOwner={isOwner} />
                )}
            </section>
        </div>
    )
}
