import BindersPage from '@/pages/binders/BindersPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/binders/')({
    component: BindersPage,
})
