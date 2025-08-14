// src/pages/AppLayout.tsx
import Nav from '@/components/layout/Nav/Nav'
import { Outlet } from '@tanstack/react-router'

const AppLayout = () => {
    return (
        <div className='min-h-screen bg-background text-foreground'>
            <Nav />
            <main className='mx-auto w-full max-w-6xl p-4'>
                <Outlet />
            </main>
        </div>
    )
}

export default AppLayout
