// src/components/common/ShareLinkButton.tsx
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
    /** If omitted, defaults to window.location.href */
    url?: string
    label?: string
    className?: string
    disabled?: boolean
    disabledHint?: string
}

export default function ShareLinkButton({
    url,
    label = 'Copy Binder Link',
    className,
    disabled,
    disabledHint,
}: Props) {
    const onClick = async () => {
        try {
            const link = url ?? (typeof window !== 'undefined' ? window.location.href : undefined)

            if (!link) throw new Error('No URL available')

            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(link)
            } else {
                // Fallback
                const el = document.createElement('textarea')
                el.value = link
                document.body.appendChild(el)
                el.select()
                document.execCommand('copy')
                document.body.removeChild(el)
            }
            toast.success('Link copied to clipboard')
        } catch (e) {
            toast.error(`Could not copy link: ${e instanceof Error ? e.message : 'Unknown Reason'}`)
        }
    }

    return (
        <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={onClick}
            className={className}
            disabled={disabled}
            title={disabled ? disabledHint : undefined}
            aria-label={label}
        >
            <Share2 className='mr-2 h-4 w-4' />
            {label}
        </Button>
    )
}
