import type { Profile, ProfileFormState, ProfilePatch, EditableKeys } from '../types'

// Build a minimal patch with only changed fields. Converts "" → null for nullable fields.
export function buildProfilePatch(current: Profile, form: ProfileFormState): ProfilePatch {
    const patch: ProfilePatch = {}

    const setIfChanged = (key: EditableKeys, value: string | null) => {
        const currentValue = (current as Record<string, unknown>)[key]
        const normalized = value === '' ? null : value
        if (normalized !== (currentValue ?? null)) {
            ;(patch as Record<string, unknown>)[key] = normalized
        }
    }

    setIfChanged('username', form.username.trim())
    setIfChanged('first_name', form.first_name)
    setIfChanged('last_name', form.last_name)
    setIfChanged('facebook_url', form.facebook_url)
    setIfChanged('location', form.location)

    return patch
}

export function formFromProfile(p: Profile): ProfileFormState {
    return {
        username: p.username ?? '',
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        facebook_url: p.facebook_url ?? null,
        location: p.location ?? null,
    }
}

export function isDirtyProfile(current: Profile, form: ProfileFormState): boolean {
    return (
        (current.username ?? '') !== form.username ||
        (current.first_name ?? null) !== form.first_name ||
        (current.last_name ?? null) !== form.last_name ||
        (current.facebook_url ?? null) !== form.facebook_url ||
        (current.location ?? null) !== form.location
    )
}
