import AuthCallback from '@/pages/auth/AuthCallback'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__auth/auth/callback')({
    component: AuthCallback,
})
