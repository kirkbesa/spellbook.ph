import * as React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { BinderCard } from '@/hooks/binders/cardTypes'

export default function RemoveBinderCardModal({
    open,
    item,
    onClose,
    onRemoved,
    removeFn,
}: {
    open: boolean
    item: BinderCard | null
    onClose: () => void
    onRemoved: () => void
    removeFn: (id: string) => Promise<boolean>
}) {
    const [loading, setLoading] = React.useState(false)

    if (!open || !item) return null

    const handleConfirm = async () => {
        setLoading(true)
        try {
            await removeFn(item.id)
            toast.success('Removed')
            onRemoved()
            onClose()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to remove')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/30'>
            <div className='bg-white p-6 rounded-lg w-[300px] max-w-full'>
                <h3 className='text-md font-semibold mb-4'>Remove Card</h3>
                <p className='mb-4 text-sm'>
                    Are you sure you want to remove <strong>{item.card?.name}</strong> from your
                    binder?
                </p>
                <div className='flex justify-end gap-2'>
                    <Button variant='outline' onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant='destructive' onClick={handleConfirm} disabled={loading}>
                        {loading ? 'Removing…' : 'Confirm'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
