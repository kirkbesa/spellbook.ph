import AppLayout from '@/pages/AppLayout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app')({
    // beforeLoad: async () => {
    //     // ask Supabase if there’s a session
    //     const {
    //         data: { session },
    //     } = await supabase.auth.getSession()

    //     // if there *is* a session, redirect away from login
    //     if (!session) {
    //         throw redirect({ to: '/login' })
    //     }
    // },
    component: AppLayout,
})
