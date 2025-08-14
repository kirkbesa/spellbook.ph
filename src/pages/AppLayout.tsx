// src/pages/AppLayout.tsx
import Nav from '@/components/layout/Nav/Nav'
import { Outlet } from '@tanstack/react-router'

const AppLayout = () => {
    return (
        <div className='bg-background text-foreground'>
            <Nav />
            <main className='mx-auto w-full max-w-6xl py-18 px-4 h-screen'>
                <Outlet />
            </main>
        </div>
    )
}

export default AppLayout
