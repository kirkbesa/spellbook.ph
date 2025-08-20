// src/routes/_app/binders/$binderId.tsx
import { createFileRoute, notFound } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/supabaseClient'
import { SpinnerCentered } from '@/components/common/Spinner'
import BinderDetailPage from '@/pages/binders/BinderDetailPage'
import type { Binder } from '@/hooks/binders/types'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export const Route = createFileRoute('/_app/binders/$binderId/')({
    loader: async ({ params }) => {
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token ?? null
        const userId = session.session?.user.id ?? null

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
        return { binder: data, userId }
    },

    pendingComponent: () => <SpinnerCentered label='Loading binder…' size='lg' />,
    notFoundComponent: () => <div className='text-sm'>Binder not found.</div>,
    component: BinderRouteComponent,
})

function BinderRouteComponent() {
    const { binder, userId } = Route.useLoaderData() as {
        binder: Binder
        userId: string | null
    }
    return <BinderDetailPage binder={binder} currentUserId={userId} />
}
