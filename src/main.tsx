import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import '@/styles/globals.css'

// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { Toaster } from 'sonner'
import { AuthProvider } from './providers/AuthProvider'

// Create a new router instance
const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
        <StrictMode>
            <AuthProvider>
                <Toaster position='top-center' richColors />
                <RouterProvider router={router} />
            </AuthProvider>
        </StrictMode>
    )
}
