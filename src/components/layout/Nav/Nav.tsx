import * as React from 'react'
import { Link as RouterLink } from '@tanstack/react-router'
import { Home, User, Book, MessageSquare, LogOut, LogIn, UserPlus } from 'lucide-react'
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { useLogout } from '@/hooks/auth/useLogout'
import { useAuth } from '@/providers/AuthProvider'
import Spacer from '../Spacer'

type NavItem = {
    to?: string
    label: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    exact?: boolean
    onClick?: () => void
}

export default function Nav() {
    const logout = useLogout()
    const { user, loading } = useAuth()

    const authenticatedNavItems: NavItem[] = [
        { to: '/', label: 'Home', icon: Home, exact: true },
        { to: '/binders', label: 'My Binders', icon: Book },
        { to: '/profile', label: 'Profile', icon: User },
        { to: '/chats', label: 'Chats', icon: MessageSquare },
    ]

    const navItems: NavItem[] = [
        { to: '/', label: 'Home', icon: Home, exact: true },
        { to: '/login', label: 'Login', icon: LogIn },
        { to: '/register', label: 'Sign Up', icon: UserPlus },
    ]

    const base =
        'relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
    const activeStyles = 'data-[active=true]:bg-accent data-[active=true]:text-accent-foreground'
    const underline =
        'after:absolute after:-bottom-1 after:left-2 after:right-2 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform hover:after:scale-x-100 data-[active=true]:after:scale-x-100'

    return (
        <nav
            className='sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'
            aria-label='Primary'
        >
            <div className='mx-auto flex h-14 w-full max-w-6xl items-center px-4'>
                {/* Brand */}
                <div className='flex items-center gap-2 text-sm font-semibold'>
                    <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary'>
                        ✦
                    </span>
                    <span>Spellbook.ph</span>
                </div>

                <Spacer />

                {/* Nav */}
                <NavigationMenu>
                    <NavigationMenuList className='gap-1 flex justify-between'>
                        {/* Nav Items */}
                        {(user ? authenticatedNavItems : navItems).map(
                            ({ to, label, icon: Icon, exact }) => (
                                <NavigationMenuItem key={to}>
                                    <NavigationMenuLink asChild>
                                        <RouterLink
                                            to={to}
                                            activeOptions={exact ? { exact: true } : undefined}
                                            className={`${base} ${activeStyles} ${underline}`}
                                            activeProps={{ 'data-active': true }}
                                            aria-label={label}
                                        >
                                            <Icon size={16} />
                                            {label}
                                        </RouterLink>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            )
                        )}

                        {/* Auth Controls */}
                        {loading
                            ? null
                            : user && (
                                  // Logout
                                  <NavigationMenuItem
                                      className='cursor-pointer ml-6'
                                      onClick={logout}
                                  >
                                      <NavigationMenuLink asChild>
                                          <span
                                              className={`${base} ${activeStyles} ${underline}`}
                                              aria-label='Logout'
                                          >
                                              <LogOut size={16} />
                                              Logout
                                          </span>
                                      </NavigationMenuLink>
                                  </NavigationMenuItem>
                              )}
                    </NavigationMenuList>
                </NavigationMenu>
            </div>
        </nav>
    )
}
