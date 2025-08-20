import * as React from 'react'
import { Loader2, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase/supabaseClient'

type Props = {
    userId: string
    url?: string | null
    size?: number // px, circle diameter
    onUploaded: (publicUrl: string) => Promise<void> | void
    className?: string
    accept?: string
    maxBytes?: number // default 3MB
}

export default function AvatarUploader({
    userId,
    url,
    size = 80,
    onUploaded,
    className,
    accept = 'image/*',
    maxBytes = 3 * 1024 * 1024,
}: Props) {
    const [uploading, setUploading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const inputRef = React.useRef<HTMLInputElement | null>(null)

    const openPicker = () => inputRef.current?.click()

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setError(null)

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file.')
            return
        }
        if (file.size > maxBytes) {
            setError(`File too large. Max ${(maxBytes / (1024 * 1024)).toFixed(1)}MB.`)
            return
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const key = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

        try {
            setUploading(true)

            // Upload
            const { error: upErr } = await supabase.storage
                .from('avatars')
                .upload(key, file, { cacheControl: '3600', upsert: false })
            if (upErr) throw upErr

            // Public URL (bucket should be public or have a public read policy)
            const { data: pub } = supabase.storage.from('avatars').getPublicUrl(key)
            const publicUrl = pub.publicUrl

            // Tell parent about the new URL (parent will update DB)
            await onUploaded(publicUrl)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload avatar')
        } finally {
            setUploading(false)
            // reset input so selecting same file again still triggers change
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    return (
        <div
            className={['relative inline-block', className].filter(Boolean).join(' ')}
            style={{ width: size, height: size }}
        >
            {/* Avatar image */}
            <button
                type='button'
                onClick={openPicker}
                className='group relative block h-full w-full rounded-full overflow-hidden border-4 border-background'
                aria-label='Change avatar'
            >
                <img
                    src={url || ''}
                    alt='Avatar'
                    className='h-full w-full object-cover bg-muted'
                    draggable={false}
                />
                {/* Bottom overlay with camera */}
                <div
                    className='
          absolute inset-x-0 bottom-0 h-8
          bg-black/40 text-white
          flex items-center justify-center gap-2
          opacity-90 group-hover:opacity-100
        '
                >
                    <span
                        className='
            inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-black
          '
                    >
                        <Camera size={14} />
                    </span>
                </div>
                {/* Uploading cover */}
                {uploading && (
                    <div className='absolute inset-0 grid place-items-center bg-black/40 text-white'>
                        <Loader2 className='h-6 w-6 animate-spin' />
                    </div>
                )}
            </button>

            {/* Hidden file input */}
            <input
                ref={inputRef}
                type='file'
                accept={accept}
                onChange={handleFile}
                className='hidden'
            />

            {error && <p className='mt-1 text-xs text-red-500'>{error}</p>}
        </div>
    )
}
