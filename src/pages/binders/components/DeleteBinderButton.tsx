// src/components/DeleteBinderButton.tsx
import * as React from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/supabaseClient'
import { Trash } from 'lucide-react'

type Props = {
    binderId: string
    onDeleted?: () => void
}

export default function DeleteBinderButton({ binderId, onDeleted }: Props) {
    const [loading, setLoading] = React.useState(false)

    const handleDelete = async () => {
        setLoading(true)

        try {
            // 1️⃣ Check if any reserved cards exist in this binder
            const { data: reservedCards, error: fetchError } = await supabase
                .from('binder_cards')
                .select('id')
                .eq('binder_id', binderId)
                .gt('reserved_quantity', 0) // only cards with reserved quantity > 0

            if (fetchError) throw fetchError

            if (reservedCards && reservedCards.length > 0) {
                toast.error('Cannot delete binder: there are reserved cards inside.')
                return
            }

            // 2️⃣ Proceed with deletion
            const { error: deleteError } = await supabase
                .from('binders')
                .delete()
                .eq('id', binderId)

            if (deleteError) throw deleteError

            toast.success('Binder deleted successfully.')
            onDeleted?.()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to delete binder')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            className='flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs hover:bg-red-600 bg-red-500 transition-all'
            onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                handleDelete()
            }}
            disabled={loading}
        >
            <span className='text-white'>{loading ? '...' : <Trash size={16} />}</span>
        </button>
    )
}
