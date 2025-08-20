// src/binders/CreateBinderForm.tsx
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    useCreateBinder,
    type CreateBinderInput,
    type Binder,
} from '@/hooks/binders/useCreateBinder'
import { toast } from 'sonner'

type Props = {
    onSuccess: (binder: Binder) => void
}

export default function CreateBinderForm({ onSuccess }: Props) {
    const { createBinder, loading, error } = useCreateBinder()

    const [name, setName] = React.useState('')
    const [pocket, setPocket] = React.useState<4 | 9 | 16>(9)
    const [privacy, setPrivacy] = React.useState<'public' | 'unlisted' | 'private'>('public')
    const [colorHex, setColorHex] = React.useState<string>('#2563eb') // default blue
    // image upload can be added later

    const canSubmit = name.trim().length > 0 && !loading

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!canSubmit) return

        const payload: CreateBinderInput = {
            name: name.trim(),
            pocket_layout: pocket,
            privacy,
            color_hex: colorHex,
        }

        try {
            const created = await createBinder(payload)
            toast.success('Binder created!')
            onSuccess(created)
        } catch {
            // error state already set in hook
        }
    }

    return (
        <Card>
            <form onSubmit={onSubmit}>
                <CardHeader className='mb-4'>
                    <CardTitle>Create a new binder</CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                    <div className='grid gap-4 sm:grid-cols-2'>
                        <div className='space-y-2 sm:col-span-2'>
                            <Label htmlFor='name'>Binder name</Label>
                            <Input
                                id='name'
                                placeholder='e.g. Trades - EDH Staples'
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='pocket'>Pocket layout</Label>
                            <select
                                id='pocket'
                                className='h-10 w-full rounded-md border bg-background px-3 text-sm'
                                value={pocket}
                                onChange={(e) => setPocket(Number(e.target.value) as 4 | 9 | 16)}
                                disabled={loading}
                            >
                                <option value={4}>4-pocket</option>
                                <option value={9}>9-pocket</option>
                                <option value={16}>16-pocket</option>
                            </select>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='privacy'>Privacy</Label>
                            <select
                                id='privacy'
                                className='h-10 w-full rounded-md border bg-background px-3 text-sm'
                                value={privacy}
                                onChange={(e) =>
                                    setPrivacy(e.target.value as 'public' | 'unlisted' | 'private')
                                }
                                disabled={loading}
                            >
                                <option value='public'>Public</option>
                                <option value='unlisted'>Unlisted</option>
                                <option value='private'>Private</option>
                            </select>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='color'>Color</Label>
                            <div className='flex items-center gap-3'>
                                <input
                                    id='color'
                                    type='color'
                                    className='h-10 w-14 cursor-pointer rounded-md border'
                                    value={colorHex}
                                    onChange={(e) => setColorHex(e.target.value)}
                                    disabled={loading}
                                />
                                <Input
                                    value={colorHex}
                                    onChange={(e) => setColorHex(e.target.value)}
                                    className='w-28'
                                    disabled={loading}
                                />
                            </div>
                            <p className='text-xs text-muted-foreground'>
                                Used as a cover accent. You can upload a cover image later.
                            </p>
                        </div>
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}

                    <div className='flex items-center gap-2'>
                        <Button type='submit' disabled={!canSubmit}>
                            {loading ? 'Creating…' : 'Create binder'}
                        </Button>
                    </div>
                </CardContent>
            </form>
        </Card>
    )
}
