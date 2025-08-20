import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/u/')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div>Hello "/_app/u/"!</div>
}
