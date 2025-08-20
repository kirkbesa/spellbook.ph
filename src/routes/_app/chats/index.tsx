import ChatsPage from '@/pages/chats/ChatsPage'
import { requireAuthOrRedirect } from '@/routes/_auth/requireAuth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/chats/')({
    beforeLoad: requireAuthOrRedirect,
    component: ChatsPage,
})
