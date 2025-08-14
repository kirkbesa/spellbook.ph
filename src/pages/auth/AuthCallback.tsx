import { useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase/supabaseClient'
import Loading from '@/components/layout/Loading'
import { toast } from 'sonner'

export default function AuthCallback() {
    const { navigate } = useRouter()

    useEffect(() => {
        // Get the session after redirect
        supabase.auth.getSession().then(({ data: { session }, error }) => {
            if (error) {
                toast.error('Failed to complete sign in.')
                navigate({ to: '/login' })
                return
            }

            if (session) {
                navigate({ to: '/' })
            } else {
                navigate({ to: '/login' })
            }
        })
    }, [navigate])

    return (
        <div className='flex h-screen items-center justify-center'>
            <Loading />
        </div>
    )
}
