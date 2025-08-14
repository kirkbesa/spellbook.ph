import Nav from '@/components/layout/Nav/Nav'
import { Outlet } from '@tanstack/react-router'

const AuthLayout = () => {
    return (
        <>
            <div className='fixed top-0 w-full'>
                <Nav />
            </div>
            <div className='w-full h-screen flex justify-center items-center'>
                <Outlet />
            </div>
        </>
    )
}

export default AuthLayout
