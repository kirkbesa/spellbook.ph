import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import NotFound from '@/pages/NotFound'

export const Route = createRootRoute({
    component: RootComponent,
    notFoundComponent: NotFound,
})

function RootComponent() {
    return (
        <React.Fragment>
            <Outlet />
        </React.Fragment>
    )
}
