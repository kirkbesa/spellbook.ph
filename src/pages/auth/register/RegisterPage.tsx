// src/pages/Register.tsx
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRegister } from '@/hooks/auth/useRegister'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import EmailConfirmation from './EmailConfirmation'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const { register, loading, error, setError } = useRegister()
    const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        const origin = typeof window !== 'undefined' ? window.location.origin : undefined
        const res = await register(email, password, {
            emailRedirectTo: origin ? `${origin}/auth/callback` : undefined, // ← changed key
        })

        if (res.ok) {
            toast.success('Check your email to confirm your account.')
            setShowEmailConfirmation(true)
            setEmail('')
            setPassword('')
            setConfirmPassword('')
        }
    }

    return (
        <div className='min-w-md max-h-auto mx-auto p-6 bg-white rounded-lg flex flex-col gap-6'>
            {!showEmailConfirmation ? (
                <>
                    <h1 className='text-2xl font-bold text-center'>Create an Account</h1>
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

                        <div>
                            <Label
                                htmlFor='confirm_password'
                                className='block text-sm font-medium mb-1'
                            >
                                Confirm Password
                            </Label>
                            <Input
                                id='confirm_password'
                                type='password'
                                placeholder='••••••••'
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <p className='text-sm justify-self-center text-red-500' role='alert'>
                                {error}
                            </p>
                        )}

                        <Button type='submit' className='w-full' disabled={loading}>
                            {loading ? 'Signing Up…' : 'Sign Up'}
                        </Button>
                    </form>
                </>
            ) : (
                <EmailConfirmation />
            )}

            <Link
                to='/login'
                className='text-xs text-muted-foreground hover:underline mx-auto cursor-pointer'
            >
                Already have an account? Login here.
            </Link>
        </div>
    )
}
