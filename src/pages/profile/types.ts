import type { Row, Update } from '@/types/types'

export type Profile = Row<'users'>

// Which fields are editable from the UI
export type EditableKeys = 'username' | 'first_name' | 'last_name' | 'facebook_url' | 'location'

// Shape of the form in the component
export type ProfileFormState = {
    username: string
    first_name: string | null
    last_name: string | null
    facebook_url: string | null
    location: string | null
}

// Patch shape to send to API (Partial of only editable keys)
export type ProfilePatch = Partial<Pick<Update<'users'>, EditableKeys>>
