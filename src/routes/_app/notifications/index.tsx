import NotificationsPage from '@/pages/notifications/NotificationsPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/notifications/')({
    component: NotificationsPage,
})
