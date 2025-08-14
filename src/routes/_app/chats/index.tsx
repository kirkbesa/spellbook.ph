import ChatsPage from '@/pages/chats/ChatsPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/chats/')({
    component: ChatsPage,
})
