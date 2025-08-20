import ProfilePage from '@/pages/profile/ProfilePage'
import { requireAuthOrRedirect } from '@/routes/_auth/requireAuth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/profile/')({
    beforeLoad: requireAuthOrRedirect,
    component: ProfilePage,
})
