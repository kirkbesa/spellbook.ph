import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProfileFormState } from '../types'
import { USERNAME_RE } from '../constants'

type Props = {
    form: ProfileFormState
    loading: boolean
    updating: boolean
    error?: string | null
    isDirty: boolean
    onChange: (key: keyof ProfileFormState) => (e: React.ChangeEvent<HTMLInputElement>) => void
    onSave: (e: React.FormEvent) => void
    onReset: () => void
}

export default function ProfileForm({
    form,
    loading,
    updating,
    error,
    isDirty,
    onChange,
    onSave,
    onReset,
}: Props) {
    const usernameValid = form.username ? USERNAME_RE.test(form.username.trim()) : true

    const hasUsername =
        form.username !== null || form.username !== undefined || form.username !== ''

    return (
        <Card>
            <form onSubmit={onSave}>
                <CardHeader>
                    <CardTitle>Edit profile</CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                    <div className='grid gap-4 sm:grid-cols-2 pt-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='username'>
                                Username{' '}
                                <span className='text-xs text-muted-foreground font-normal'>
                                    (cannot be changed once set)
                                </span>
                            </Label>
                            <Input
                                id='username'
                                value={form.username}
                                onChange={onChange('username')}
                                disabled={loading || updating || hasUsername}
                                className={
                                    usernameValid && !form.username
                                        ? 'border-green-500 focus-visible:ring-green-500'
                                        : form.username
                                          ? 'border-neutral-500 focus-visible:ring-neutral-500'
                                          : 'border-red-500 focus-visible:ring-red-500'
                                }
                                placeholder='e.g. faeriemastermind'
                            />
                            <p className='text-xs text-muted-foreground'>
                                3–24 characters: letters, numbers, underscore.
                            </p>
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='facebook_url'>Facebook (link)</Label>
                            <Input
                                id='facebook_url'
                                value={form.facebook_url ?? ''}
                                onChange={onChange('facebook_url')}
                                disabled={loading || updating}
                                placeholder='https://facebook.com/your.profile'
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='first_name'>First name</Label>
                            <Input
                                id='first_name'
                                value={form.first_name ?? ''}
                                onChange={onChange('first_name')}
                                disabled={loading || updating}
                                placeholder='(optional)'
                            />
                        </div>

                        <div className='space-y-2'>
                            <Label htmlFor='last_name'>Last name</Label>
                            <Input
                                id='last_name'
                                value={form.last_name ?? ''}
                                onChange={onChange('last_name')}
                                disabled={loading || updating}
                                placeholder='(optional)'
                            />
                        </div>

                        <div className='space-y-2 sm:col-span-2'>
                            <Label htmlFor='location'>Location</Label>
                            <Input
                                id='location'
                                value={form.location ?? ''}
                                onChange={onChange('location')}
                                disabled={loading || updating}
                                placeholder='e.g. Quezon City, NCR'
                            />
                        </div>
                    </div>

                    {error && <p className='text-sm text-red-500'>{error}</p>}

                    <div className='flex items-center gap-2'>
                        <Button
                            type='submit'
                            disabled={!isDirty || !usernameValid || loading || updating}
                        >
                            {updating ? 'Saving…' : 'Save changes'}
                        </Button>
                        <Button
                            type='button'
                            variant='ghost'
                            onClick={onReset}
                            disabled={!isDirty || updating}
                        >
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </form>
        </Card>
    )
}
