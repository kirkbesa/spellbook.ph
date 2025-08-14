import React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import type { Session, User } from '@supabase/supabase-js'

type AuthState = {
    user: User | null
    session: Session | null
    loading: boolean
}

const AuthContext = React.createContext<AuthState>({
    user: null,
    session: null,
    loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = React.useState<AuthState>({
        user: null,
        session: null,
        loading: true,
    })

    React.useEffect(() => {
        let mounted = true

        // 1) Get current session immediately
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return
            setState({ user: session?.user ?? null, session, loading: false })
        })

        // 2) Listen for future changes (sign-in/out, refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setState({ user: session?.user ?? null, session, loading: false })
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return React.useContext(AuthContext)
}
