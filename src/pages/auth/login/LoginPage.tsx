// src/pages/Login.tsx
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLogin } from '@/hooks/auth/useLogin'
import { Link, useNavigate } from '@tanstack/react-router'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { login, loading, error, setError } = useLogin()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const { ok, error } = await login(email, password)

        if (error) {
            setError(error)
        } else if (ok) {
            navigate({ to: '/' })
        }
    }

    return (
        <div className='min-w-full md:min-w-md max-h-auto mx-auto bg-white rounded-lg flex flex-col gap-6'>
            <h1 className='text-2xl font-bold text-center'>Login</h1>

            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <Label htmlFor='email' className='block text-sm font-medium mb-1'>
                        Email
                    </Label>
                    <Input
                        id='email'
                        type='email'
                        placeholder='you@example.com'
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div>
                    <Label htmlFor='password' className='block text-sm font-medium mb-1'>
                        Password
                    </Label>
                    <Input
                        id='password'
                        type='password'
                        placeholder='••••••••'
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </div>

                {error && (
                    <p
                        className={`text-sm justify-self-center ${error === 'Email not confirmed' ? 'text-amber-500' : 'text-red-500'}`}
                        role='alert'
                    >
                        {error}
                    </p>
                )}

                <Button type='submit' className='w-full' disabled={loading}>
                    {loading ? 'Logging in…' : 'Log In'}
                </Button>
            </form>

            <Link
                to='/register'
                className='text-xs text-muted-foreground hover:underline mx-auto cursor-pointer'
            >
                Don&apos;t have an account? Sign Up here.
            </Link>
        </div>
    )
}
