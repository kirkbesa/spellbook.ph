// src/pages/Register.tsx
import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRegister } from '@/hooks/auth/useRegister'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import EmailConfirmation from './EmailConfirmation'
import { useUsernameAvailability } from '@/hooks/auth/useUsernameAvailability'

export default function RegisterPage() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const { register, loading, error, setError } = useRegister()
    const [showEmailConfirmation, setShowEmailConfirmation] = useState(false)

    const { valid, checking, available } = useUsernameAvailability(username)

    const canSubmit =
        !!email &&
        !!password &&
        password === confirmPassword &&
        // allow submit if availability is true OR unknown (null) but format is valid;
        // you can make this stricter if you want:
        valid &&
        available !== false &&
        !loading

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
        if (!valid) {
            setError('Username must be 3–24 chars (letters, numbers, underscore).')
            return
        }
        if (available === false) {
            setError('That username is taken. Try another.')
            return
        }

        const origin = typeof window !== 'undefined' ? window.location.origin : undefined
        const res = await register(email, password, {
            emailRedirectTo: origin ? `${origin}/auth/callback` : undefined, // ← changed key
            username: username.trim(),
        })

        if (res.ok) {
            toast.success('Check your email to confirm your account.')
            setShowEmailConfirmation(true)
            setUsername('')
            setEmail('')
            setPassword('')
            setConfirmPassword('')
        } else if (res.error?.toLowerCase().includes('unique')) {
            // catch rare race against another user taking it
            setError('That username just got taken. Pick another.')
        }
    }

    return (
        <div className='min-w-full md:min-w-md max-h-auto mx-auto bg-white rounded-lg flex flex-col gap-6'>
            {!showEmailConfirmation ? (
                <>
                    <h1 className='text-2xl font-bold text-center'>Create an Account</h1>
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        {/* Email */}
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

                        {/* Username */}
                        <div>
                            <Label
                                htmlFor='username'
                                className='flex justify-between text-sm space-x-2 mb-1'
                            >
                                <span className='font-medium'>Username</span>
                                <span className='font-normal text-xs'>
                                    {checking && valid && 'Checking availability…'}
                                    {!checking && username && available === false && (
                                        <span className='text-red-600'>Username is taken.</span>
                                    )}
                                    {!checking && username && valid && available && (
                                        <span className='text-green-600'>Username Available!</span>
                                    )}
                                    {!valid && username && (
                                        <span className='text-red-600'>
                                            3–24 characters: letters, numbers, underscore.
                                        </span>
                                    )}
                                </span>
                            </Label>
                            <Input
                                id='username'
                                placeholder='e.g. moggfanatic123'
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={loading}
                                className={
                                    username
                                        ? available === false
                                            ? 'border-red-500 focus-visible:ring-red-500'
                                            : valid
                                              ? 'border-green-500 focus-visible:ring-green-500'
                                              : 'border-red-500 focus-visible:ring-red-500'
                                        : undefined
                                }
                            />
                            <p className='text-xs mt-1'></p>
                        </div>

                        {/* Password */}
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

                        <Button type='submit' className='w-full' disabled={!canSubmit}>
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
