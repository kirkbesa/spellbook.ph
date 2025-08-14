import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/supabaseClient'
import AppLayout from '@/pages/AppLayout'

export const Route = createFileRoute('/')({
    beforeLoad: async () => {
        // ask Supabase if there’s a session
        const {
            data: { session },
        } = await supabase.auth.getSession()

        // if there *is* a session, redirect away from login
        if (!session) {
            throw redirect({ to: '/login' })
        }
    },
    component: AppLayout,
})
