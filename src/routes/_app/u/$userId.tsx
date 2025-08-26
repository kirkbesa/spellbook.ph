import { createFileRoute, redirect, notFound } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/supabaseClient'
import { SpinnerCentered } from '@/components/common/Spinner'
import PublicUserProfilePage from '@/pages/users/PublicUserProfilePage'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export const Route = createFileRoute('/_app/u/$userId')({
    loader: async ({ params }) => {
        // Require login
        const { data: session } = await supabase.auth.getSession()
        const token = session.session?.access_token ?? null
        const currentUserId = session.session?.user.id ?? null
        if (!currentUserId) {
            throw redirect({
                to: '/login',
                search: { redirect: `/u/${params.userId}` },
            })
        }

        // Load public profile + public binders from your backend
        const [profRes, bindsRes] = await Promise.all([
            fetch(`${API_BASE}/api/users/public/${params.userId}`, {
                headers: { 'Content-Type': 'application/json' },
            }),
            fetch(`${API_BASE}/api/binders/by-user/${params.userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            }),
        ])

        if (profRes.status === 404) throw notFound()
        if (!profRes.ok) {
            const body = await profRes.json().catch(() => ({}))
            throw new Error(body?.error || `Failed to load user (${profRes.status})`)
        }
        if (!bindsRes.ok) {
            const body = await bindsRes.json().catch(() => ({}))
            throw new Error(body?.error || `Failed to load binders (${bindsRes.status})`)
        }

        const { data: profile } = await profRes.json()
        const { data: binders } = await bindsRes.json()

        return { profile, binders, currentUserId }
    },

    pendingComponent: () => <SpinnerCentered label='Loading profile…' size='lg' />,
    notFoundComponent: () => <div className='text-sm'>User not found.</div>,
    component: UserRouteComponent,
})

function UserRouteComponent() {
    const { profile, binders, currentUserId } = Route.useLoaderData() as {
        profile: {
            id: string
            username: string | null
            first_name: string | null
            last_name: string | null
            location: string | null
            image_url: string | null
            isverified: boolean | null
        }
        binders: Array<{
            id: string
            owner_id: string
            name: string
            description: string | null
            color_hex: string | null
            pocket_layout: number | null
            image_url: string | null
            privacy: 'public' | 'unlisted' | 'private'
            created_at: string
            updated_at: string
            card_count: number
        }>
        currentUserId: string
    }

    return (
        <PublicUserProfilePage profile={profile} binders={binders} currentUserId={currentUserId} />
    )
}
