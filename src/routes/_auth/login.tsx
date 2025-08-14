import LoginPage from '@/pages/auth/login/LoginPage'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/supabaseClient'

export const Route = createFileRoute('/_auth/login')({
    beforeLoad: async ({ search }) => {
        const {
            data: { session },
        } = await supabase.auth.getSession()
        if (session) {
            // send them to their intended destination or home
            throw redirect({ to: (search as any)?.redirect ?? '/' })
        }
    },
    component: LoginPage,
})
