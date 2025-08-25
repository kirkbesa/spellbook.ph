// src/pages/binders/BindersPage.tsx
import { Link } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { FolderClosed, Plus } from 'lucide-react'
import { useMyBinders } from '@/hooks/binders/useMyBinders'
import { SpinnerCentered } from '@/components/common/Spinner'
import BinderTile from './components/BinderTile'

export default function BindersPage() {
    const { binders, loading, error } = useMyBinders()

    if (loading) return <SpinnerCentered label='Loading your binders…' size='lg' />
    if (!loading && binders.length === 0) {
        return (
            <div className='mx-auto max-w-5xl space-y-4'>
                <h1 className='text-2xl font-bold'>My Binders</h1>
                <CreateTile />
            </div>
        )
    }

    return (
        <div className='mx-auto max-w-5xl space-y-4'>
            <h1 className='text-2xl font-bold'>My Binders</h1>
            {error && <p className='text-sm text-red-500'>{error}</p>}

            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {binders.map((b) => (
                    <div key={b.id} className='h-full'>
                        <BinderTile
                            binder={{
                                id: b.id,
                                name: b.name,
                                privacy: b.privacy,
                                image_url: b.image_url ?? null, // make sure your hook returns image_url
                                card_count: b.card_count ?? 0,
                            }}
                        />
                    </div>
                ))}

                <CreateTile />
            </div>
        </div>
    )
}

function CreateTile() {
    return (
        <Link to='/binders/create' className='block h-full'>
            <Card className='flex h-full flex-col items-center justify-center gap-2 p-6 text-center transition-transform hover:scale-[1.02]'>
                <div className='flex items-center gap-3'>
                    <FolderClosed className='h-10 w-10' />
                    <Plus className='h-6 w-6' />
                </div>
                <div className='text-sm text-muted-foreground'>Create New Binder</div>
            </Card>
        </Link>
    )
}
