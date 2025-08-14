import LoginPage from '@/pages/auth/login/LoginPage'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/supabaseClient'

export const Route = createFileRoute('/__auth/login')({
    component: LoginPage,
    beforeLoad: async () => {
        // ask Supabase if there’s a session
        const {
            data: { session },
        } = await supabase.auth.getSession()

        // if there *is* a session, redirect away from login
        if (session) {
            throw redirect({ to: '/' })
        }
    },
})
