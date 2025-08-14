import AuthLayout from '@/pages/auth/AuthLayout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
    component: AuthLayout,
})
