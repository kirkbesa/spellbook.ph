// src/pages/binders/BinderDetailPage.tsx
import type { Binder } from '@/hooks/binders/types'
import BinderHeader from './components/BinderHeader'
import BackButton from '@/components/common/BackButton'
import ShareLinkButton from '@/components/common/ShareLinkButton'
import { Link } from '@tanstack/react-router'
import { Cog } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
    binder: Binder
    currentUserId?: string | null
}

export default function BinderDetailPage({ binder, currentUserId }: Props) {
    const isOwner = currentUserId === binder.owner_id

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
                                variant={'ghost'}
                                className='flex gap-2 items-center rounded-md border px-2.5 py-1.5 hover:bg-accent'
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

            <section className='rounded-lg border p-4'>
                <h2 className='mb-2 text-lg font-semibold'>Cards</h2>
                <p className='text-sm text-muted-foreground'>
                    Card input & management UI coming next. For now, this is your binder’s detail
                    page.
                </p>
                {isOwner && (
                    <div className='mt-3 text-xs text-muted-foreground'>
                        You’ll be able to add cards, set prices, and share this binder.
                    </div>
                )}
            </section>
        </div>
    )
}
