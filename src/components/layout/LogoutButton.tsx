import { Button } from '../ui/button'
import { useLogout } from '@/hooks/auth/useLogout'

const LogoutButton = () => {
    const logout = useLogout()

    return <Button onClick={logout}>Logout</Button>
}

export default LogoutButton
