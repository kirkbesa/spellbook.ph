import { Outlet } from '@tanstack/react-router'

const AuthLayout = () => {
    return (
        <div className='my-auto flex justify-center items-center mt-32'>
            <Outlet />
        </div>
    )
}

export default AuthLayout
