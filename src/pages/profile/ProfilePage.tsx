import * as React from 'react'
import { toast } from 'sonner'
import { SpinnerCentered } from '@/components/layout/Spinner'
import { useProfile } from '@/hooks/profile/useProfile'
import ProfileHeader from './components/ProfileHeader'
import ProfileForm from './components/ProfileForm'
import { USERNAME_RE } from './constants'
import type { ProfileFormState } from './types'
import { buildProfilePatch, formFromProfile, isDirtyProfile } from './utils/patch'

export default function ProfilePage() {
    const { profile, loading, error, updating, updateProfile } = useProfile()
    const [form, setForm] = React.useState<ProfileFormState>({
        username: '',
        first_name: null,
        last_name: null,
        facebook_url: null,
        location: null,
    })

    // hydrate form when profile loads/changes
    React.useEffect(() => {
        if (profile) setForm(formFromProfile(profile))
    }, [profile])

    const isDirty = React.useMemo(
        () => (profile ? isDirtyProfile(profile, form) : false),
        [profile, form]
    )

    const onChange = (key: keyof ProfileFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value
        setForm((f) => ({ ...f, [key]: v === '' ? (key === 'username' ? '' : null) : v }))
    }

    const onSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile) return
        // light client-side username format check; DB still enforces uniqueness
        if (form.username && !USERNAME_RE.test(form.username.trim())) {
            toast.error('Username must be 3–24 chars (letters, numbers, underscore).')
            return
        }
        const patch = buildProfilePatch(profile, form)
        if (Object.keys(patch).length === 0) return
        try {
            await updateProfile(patch)
            toast.success('Profile updated')
        } catch (err) {
            const msg = String(err instanceof Error ? err.message : '')
            if (/duplicate|unique/i.test(msg)) {
                toast.error('That username is taken. Try another.')
            } else {
                toast.error('Failed to update profile')
            }
        }
    }

    const onReset = () => {
        if (profile) setForm(formFromProfile(profile))
    }

    if (loading || !profile) {
        return <SpinnerCentered label='Loading Profile...' size='lg' />
    }

    return (
        <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 pb-4'>
            <ProfileHeader
                profile={profile}
                onAvatarUploaded={async (url) => {
                    await updateProfile({ image_url: url })
                }}
            />
            <ProfileForm
                form={form}
                loading={loading}
                updating={updating}
                error={error}
                isDirty={isDirty}
                onChange={onChange}
                onSave={onSave}
                onReset={onReset}
            />
        </div>
    )
}
