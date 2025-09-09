import BrowsePage from '@/pages/browse/BrowsePage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/browse/')({
    component: BrowsePage,
})
