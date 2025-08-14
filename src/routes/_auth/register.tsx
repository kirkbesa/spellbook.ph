import RegisterPage from '@/pages/auth/register/RegisterPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/register')({
    component: RegisterPage,
})
