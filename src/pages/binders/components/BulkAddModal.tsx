import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useBulkAddCards } from '@/hooks/binders/useBulkAddCards'

type Props = {
    binderId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onAdded?: () => void
}

export default function BulkAddModal({ binderId, open, onOpenChange, onAdded }: Props) {
    const [list, setList] = React.useState('')
    const { addCards, loading } = useBulkAddCards(binderId)

    const parseList = (raw: string) => {
        const parsedItems = raw
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const match = line.match(/^(\d+)\s*x?\s*(.+)$/i)
                if (match)
                    return { qty: parseInt(match[1], 10), name: match[2].trim().toLowerCase() }
                return { qty: 1, name: line.toLowerCase() }
            })

        const mergedMap = new Map<string, number>()
        parsedItems.forEach(({ qty, name }) => {
            const existingQty = mergedMap.get(name) || 0
            mergedMap.set(name, existingQty + qty)
        })

        return Array.from(mergedMap, ([name, qty]) => ({ name, qty }))
    }

    const onSubmit = async () => {
        const entries = parseList(list)
        if (!entries.length) {
            toast.error('No valid cards found')
            return
        }

        try {
            const result = await addCards(entries)

            if (result.success.length) {
                toast.success(
                    `Added ${result.success.length} card${result.success.length > 1 ? 's' : ''}`
                )
                setList('')
                onAdded?.()
                onOpenChange(false)
            }

            if (result.notFound.length) {
                toast.error(`These cards could not be found: ${result.notFound.join(', ')}`)
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to bulk add cards')
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='max-w-lg'>
                <DialogHeader>
                    <DialogTitle>Bulk Add Cards</DialogTitle>
                </DialogHeader>
                <Textarea
                    rows={10}
                    value={list}
                    onChange={(e) => setList(e.target.value)}
                    placeholder={`Paste your list here...\nExamples:\n4x Sacred Cat\n4 Squadron Hawk\nOutlaw Medic`}
                    className='text-sm sm:text-md'
                />
                <div className='flex justify-end gap-2 pt-4'>
                    <Button variant='ghost' onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={loading}>
                        {loading ? 'Adding…' : 'Add All'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
