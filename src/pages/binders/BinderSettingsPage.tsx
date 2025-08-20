// src/pages/binders/BinderSettingsPage.tsx
import * as React from 'react'
import type { Binder } from '@/hooks/binders/types'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'
import BackButton from '@/components/common/BackButton'
import { useRouter } from '@tanstack/react-router'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

type Props = {
    binder: Binder
}

export default function BinderSettingsPage({ binder }: Props) {
    const router = useRouter()

    const [name, setName] = React.useState(binder.name)
    const [privacy, setPrivacy] = React.useState<Binder['privacy']>(binder.privacy)
    const [color, setColor] = React.useState(binder.color_hex ?? '')
    const [saving, setSaving] = React.useState(false)

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            const { data: session } = await supabase.auth.getSession()
            const token = session.session?.access_token
            if (!token) throw new Error('Not authenticated')

            const res = await fetch(`${API_BASE}/api/binders/${binder.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    privacy,
                    color_hex: color || null,
                }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body?.error || `Update failed (${res.status})`)
            }

            await router.invalidate()

            toast.success('Binder updated')
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to update binder')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className='mx-auto w-full max-w-3xl space-y-6'>
            <BackButton fallbackTo='/binders' />
            <h1 className='text-xl font-semibold'>Binder Settings</h1>
            <form onSubmit={onSave} className='space-y-4 rounded-lg border p-4'>
                <div className='space-y-1'>
                    <label className='text-sm font-medium'>Name</label>
                    <input
                        className='w-full rounded-md border px-3 py-2 text-sm'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='Binder name'
                    />
                </div>

                <div className='space-y-1'>
                    <label className='text-sm font-medium'>Privacy</label>
                    <select
                        className='w-full rounded-md border px-3 py-2 text-sm'
                        value={privacy}
                        onChange={(e) => setPrivacy(e.target.value as Binder['privacy'])}
                    >
                        <option value='public'>Public</option>
                        <option value='unlisted'>Unlisted</option>
                        <option value='private'>Private</option>
                    </select>
                </div>

                <div className='space-y-1'>
                    <label className='text-sm font-medium'>Color (hex)</label>
                    <input
                        className='w-full rounded-md border px-3 py-2 text-sm'
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        placeholder='#aabbcc'
                    />
                </div>

                <div className='flex items-center gap-2'>
                    <button
                        type='submit'
                        disabled={saving}
                        className='rounded-md border px-3 py-2 text-sm hover:bg-accent disabled:opacity-50'
                    >
                        {saving ? 'Saving…' : 'Save changes'}
                    </button>
                </div>
            </form>
        </div>
    )
}
