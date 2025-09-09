import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { BulkSearchResponse } from '../BrowsePage'

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onResults?: (payload: BulkSearchResponse) => void
}

export default function BulkSearchModal({ open, onOpenChange, onResults }: Props) {
    const [list, setList] = React.useState('')
    const [loading, setLoading] = React.useState(false)

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

        setLoading(true)
        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE}/api/binder-cards/bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ searchItems: entries }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Search failed')
            }

            const data: BulkSearchResponse = await response.json()
            toast.success(`Found ${data.results.length} binders with matching cards`)
            onResults?.(data) // pass the whole payload

            onOpenChange(false)
            setList('') // Clear the form after successful search
        } catch (err) {
            console.error('Bulk search error:', err)
            toast.error(err instanceof Error ? err.message : 'Failed to search cards')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        if (!loading) {
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className='max-w-lg p-6'>
                <DialogHeader>
                    <DialogTitle>Bulk Search Cards</DialogTitle>
                </DialogHeader>
                <Textarea
                    rows={10}
                    value={list}
                    onChange={(e) => setList(e.target.value)}
                    placeholder={`Paste your list here...\nExamples:\n4x Sacred Cat\n4 Squadron Hawk\nOutlaw Medic\n\nEach line should contain a card name, optionally with quantity.`}
                    className='text-sm sm:text-md'
                    disabled={loading}
                />
                <div className='flex justify-end gap-2 pt-4'>
                    <Button variant='ghost' onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={onSubmit} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Searching...
                            </>
                        ) : (
                            'Search'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
