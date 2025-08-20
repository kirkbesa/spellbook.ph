// src/routes/_app/binders/$binderId/settings.tsx
import { createFileRoute, redirect, notFound } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/supabaseClient'
import { SpinnerCentered } from '@/components/common/Spinner'
import type { Binder } from '@/hooks/binders/types'
import BinderSettingsPage from '@/pages/binders/BinderSettingsPage'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export const Route = createFileRoute('/_app/binders/$binderId/settings')({
    beforeLoad: async ({ location }) => {
        // require auth
        const {
            data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
            throw redirect({ to: '/login', search: { redirect: location.href } })
        }
    },

    loader: async ({ params }) => {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token
        const userId = session.session?.user.id

        const res = await fetch(`${API_BASE}/api/binders/${params.binderId}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        })

        if (res.status === 404) throw notFound()
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body?.error || `Failed to load binder (${res.status})`)
        }

        const { data } = (await res.json()) as { data: Binder }

        // owner-only edit
        if (!userId || data.owner_id !== userId) {
            throw redirect({ to: '/binders/$binderId', params: { binderId: params.binderId } })
        }

        return { binder: data }
    },
    staleTime: 0,
    pendingComponent: () => <SpinnerCentered label='Loading settings…' size='lg' />,
    notFoundComponent: () => <div className='text-sm'>Binder not found.</div>,
    component: SettingsRouteComponent,
})

function SettingsRouteComponent() {
    const { binder } = Route.useLoaderData() as { binder: Binder }
    return <BinderSettingsPage binder={binder} />
}
