import { createRootRoute } from '@tanstack/react-router'
import NotFound from '@/pages/NotFound'
import AppLayout from '@/pages/AppLayout'

export const Route = createRootRoute({
    component: AppLayout,
    notFoundComponent: NotFound,
})
