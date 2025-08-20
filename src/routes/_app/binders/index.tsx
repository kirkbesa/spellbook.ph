// src/routes/_app/binders/index.tsx
import BindersPage from '@/pages/binders/BindersPage'
import { requireAuthOrRedirect } from '@/routes/_auth/requireAuth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/binders/')({
    beforeLoad: requireAuthOrRedirect,
    component: BindersPage,
})
