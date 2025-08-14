// src/pages/Login.tsx
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLogin } from '@/hooks/useLogin'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const { login, loading } = useLogin()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        login(email, password)
    }

    return (
        <div className='max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow'>
            <h1 className='text-2xl font-bold mb-6 text-center'>Sign In</h1>
            <form onSubmit={handleSubmit} className='space-y-4'>
                <div>
                    <label htmlFor='email' className='block text-sm font-medium mb-1'>
                        Email
                    </label>
                    <Input
                        id='email'
                        type='email'
                        placeholder='you@example.com'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div>
                    <label htmlFor='password' className='block text-sm font-medium mb-1'>
                        Password
                    </label>
                    <Input
                        id='password'
                        type='password'
                        placeholder='••••••••'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <Button type='submit' className='w-full' disabled={loading}>
                    {loading ? 'Signing in…' : 'Sign In'}
                </Button>
            </form>
        </div>
    )
}
