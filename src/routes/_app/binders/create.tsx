import CreateNewBinderPage from '@/pages/binders/CreateNewBinderPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/binders/create')({
    component: CreateNewBinderPage,
})
