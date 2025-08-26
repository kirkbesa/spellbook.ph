import * as React from 'react'
import { Link as RouterLink } from '@tanstack/react-router'
import {
    Home,
    User,
    MessageSquare,
    LogOut,
    LogIn,
    UserPlus,
    Menu,
    FolderClosed,
    Bell,
} from 'lucide-react'

import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetHeader,
    SheetTitle,
    SheetClose,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/auth/useLogout'
import { useAuth } from '@/providers/AuthProvider'
import { useUnreadMessageCount } from '@/hooks/notifications/useUnreadMessageCount'

type NavItem = {
    to: string
    label: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    exact?: boolean
}

const authedItems: NavItem[] = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/binders', label: 'My Binders', icon: FolderClosed },
    { to: '/chats', label: 'Chats', icon: MessageSquare },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: User },
]

const publicItems: NavItem[] = [
    { to: '/', label: 'Home', icon: Home, exact: true },
    { to: '/login', label: 'Login', icon: LogIn },
    { to: '/register', label: 'Sign Up', icon: UserPlus },
]

export default function Nav() {
    const { user, loading } = useAuth()
    const logout = useLogout()
    const items = user ? authedItems : publicItems

    const base =
        'relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
    const activeStyles = 'data-[active=true]:bg-accent data-[active=true]:text-accent-foreground'
    const underline =
        'after:absolute after:-bottom-1 after:left-2 after:right-2 after:h-0.5 after:origin-center after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform hover:after:scale-x-100 data-[active=true]:after:scale-x-100'

    // ⬇️ unread messages for chats (0 if logged out)
    const { count: unread } = useUnreadMessageCount(user?.id)

    // tiny badge component for reuse
    const BadgeDot = ({ value }: { value: number }) => (
        <span className='absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white'>
            {value > 99 ? '99+' : value}
        </span>
    )

    return (
        <nav
            className='fixed inset-x-0 top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60'
            aria-label='Primary'
        >
            <div className='mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4'>
                {/* Brand */}
                <div className='flex items-center gap-2 text-sm font-semibold'>
                    <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary'>
                        ✦
                    </span>
                    <span>Spellbook.ph</span>
                </div>

                {/* Desktop nav */}
                <div className='ml-auto hidden md:block'>
                    <NavigationMenu>
                        <NavigationMenuList className='gap-1'>
                            {items.map(({ to, label, icon: Icon, exact }) => (
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
                                            {/* badge only on Chats and only when unread > 0 */}
                                            {to === '/chats' && unread > 0 ? (
                                                <BadgeDot value={unread} />
                                            ) : null}
                                        </RouterLink>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}

                            {/* Desktop auth control */}
                            {!loading && user && (
                                <NavigationMenuItem className='cursor-pointer'>
                                    <NavigationMenuLink asChild>
                                        <button
                                            onClick={logout}
                                            className={`${base} ${activeStyles} ${underline}`}
                                            aria-label='Logout'
                                        >
                                            <LogOut size={16} />
                                            Logout
                                        </button>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            )}
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Mobile hamburger */}
                <div className='ml-auto md:hidden'>
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant='ghost' size='icon' aria-label='Open menu'>
                                <Menu size={20} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side='right' className='w-80'>
                            <SheetHeader>
                                <SheetTitle className='flex items-center gap-2'>
                                    <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary'>
                                        ✦
                                    </span>
                                    <span>Spellbook.ph</span>
                                </SheetTitle>
                            </SheetHeader>

                            <div className='flex flex-col gap-2'>
                                {items.map(({ to, label, icon: Icon, exact }) => (
                                    <SheetClose asChild key={to}>
                                        <RouterLink
                                            to={to}
                                            activeOptions={exact ? { exact: true } : undefined}
                                            className='relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                            activeProps={{
                                                className:
                                                    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-accent text-accent-foreground',
                                            }}
                                            aria-label={label}
                                        >
                                            <Icon size={18} />
                                            {label}
                                            {to === '/chats' && unread > 0 ? (
                                                <span className='absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white'>
                                                    {unread > 99 ? '99+' : unread}
                                                </span>
                                            ) : null}
                                        </RouterLink>
                                    </SheetClose>
                                ))}

                                {/* Mobile auth controls */}
                                {!loading && user ? (
                                    <SheetClose asChild>
                                        <button
                                            onClick={logout}
                                            className='mt-2 inline-flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground'
                                            aria-label='Logout'
                                        >
                                            <LogOut size={18} />
                                            Logout
                                        </button>
                                    </SheetClose>
                                ) : null}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </nav>
    )
}
