// src/pages/chats/UserSearchBox.tsx
import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUserSearch } from '@/hooks/users/useUserSearch'

type Props = {
    myUserId?: string
    onPick: (username: string) => void | Promise<void>
}

export default function UserSearchBox({ myUserId, onPick }: Props) {
    const [value, setValue] = React.useState('')
    const { results, loading, search, setResults } = useUserSearch(myUserId)

    // debounce
    React.useEffect(() => {
        const t = setTimeout(() => search(value), 200)
        return () => clearTimeout(t)
    }, [value, search])

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        const picked = results[0]?.username || value.trim()
        if (!picked) return
        await onPick(picked)
        setValue('')
        setResults([])
    }

    return (
        <div className='relative'>
            <form onSubmit={submit} className='flex gap-2'>
                <Input
                    placeholder='Start new chat by @username'
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    autoComplete='off'
                />
                <Button type='submit' disabled={!value.trim() && results.length === 0}>
                    Go
                </Button>
            </form>

            {/* Suggestions dropdown */}
            {value.trim() && (loading || results.length > 0) && (
                <div className='absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow'>
                    {loading && (
                        <div className='px-3 py-2 text-sm text-muted-foreground'>Searching…</div>
                    )}
                    {!loading && results.length === 0 && (
                        <div className='px-3 py-2 text-sm text-muted-foreground'>No matches</div>
                    )}
                    {!loading && results.length > 0 && (
                        <ul className='max-h-64 overflow-auto'>
                            {results.map((u) => (
                                <li key={u.id}>
                                    <button
                                        type='button'
                                        className='flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent'
                                        onClick={async () => {
                                            if (!u.username) return
                                            await onPick(u.username)
                                            setValue('')
                                            setResults([])
                                        }}
                                    >
                                        <img
                                            src={u.image_url ?? ''}
                                            className='h-7 w-7 rounded-full border object-cover'
                                            onError={(e) =>
                                                ((
                                                    e.currentTarget as HTMLImageElement
                                                ).style.display = 'none')
                                            }
                                        />
                                        <span className='truncate text-sm'>@{u.username}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
