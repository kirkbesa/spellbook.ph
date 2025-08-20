// src/pages/binders/BindersPage.tsx
import { Link } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { FolderClosed, Plus, Layers, Cog } from 'lucide-react'
import { useMyBinders } from '@/hooks/binders/useMyBinders'
import { SpinnerCentered } from '@/components/common/Spinner'
import { Badge } from '@/components/ui/badge'

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
                        <Card className='flex h-full flex-col p-4 transition-transform hover:scale-[1.02]'>
                            <div className='flex items-center gap-4'>
                                <div
                                    className='h-12 w-12 shrink-0 rounded-md border'
                                    style={{ background: b.color_hex ?? '#e5e7eb' }}
                                />
                                <div className='min-w-0 flex-1'>
                                    <div className='flex gap-2'>
                                        <div className='truncate font-medium'>{b.name}</div>
                                        <Badge variant={'outline'}>
                                            {b.privacy.charAt(0).toUpperCase() + b.privacy.slice(1)}
                                        </Badge>
                                    </div>

                                    <div className='mt-1 flex items-center gap-2 text-xs text-muted-foreground'>
                                        <Layers size={14} />
                                        <span className='truncate'>
                                            {b.card_count} {b.card_count === 1 ? 'card' : 'cards'}
                                        </span>
                                        <span aria-hidden>•</span>
                                        <span>{b.pocket_layout}-pocket</span>
                                    </div>
                                </div>
                            </div>

                            <div className='mt-3 flex items-center justify-end gap-2'>
                                <Link
                                    to='/binders/$binderId'
                                    params={{ binderId: b.id }}
                                    className='inline-flex'
                                >
                                    <button className='rounded-md border px-2.5 py-1.5 text-xs hover:bg-accent'>
                                        Open
                                    </button>
                                </Link>
                                <Link
                                    to='/binders/$binderId/settings'
                                    params={{ binderId: b.id }}
                                    className='inline-flex'
                                >
                                    <button className='flex gap-2 items-center rounded-md border px-2.5 py-1.5 text-xs hover:bg-accent'>
                                        <Cog size={16} />
                                        <span>Settings</span>
                                    </button>
                                </Link>
                            </div>
                        </Card>
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
            <Card className='h-full flex flex-col items-center justify-center gap-2 p-6 text-center transition-transform hover:scale-[1.02]'>
                <div className='flex items-center gap-3'>
                    <FolderClosed className='h-10 w-10' />
                    <Plus className='h-6 w-6' />
                </div>
                <div className='text-sm text-muted-foreground'>Create New Binder</div>
            </Card>
        </Link>
    )
}
