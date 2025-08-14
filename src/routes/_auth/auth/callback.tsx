import AuthCallback from '@/pages/auth/AuthCallback'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/auth/callback')({
    component: AuthCallback,
})
