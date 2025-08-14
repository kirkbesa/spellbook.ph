import { supabase } from '@/lib/supabase/supabaseClient'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
    beforeLoad: async ({ location }) => {
        const {
            data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
            // send them back to what they wanted after login
            throw redirect({ to: '/login', search: { redirect: location.href } })
        }
    },
    component: () => <Outlet />,
})
