import OffersPage from '@/pages/offers/OffersPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/offers/')({
    component: OffersPage,
})
