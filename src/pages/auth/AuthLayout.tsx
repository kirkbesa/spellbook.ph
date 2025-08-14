import { Outlet } from '@tanstack/react-router'

const AuthLayout = () => {
    return (
        <div className='w-full h-screen flex justify-center items-center'>
            <Outlet />
        </div>
    )
}

export default AuthLayout
