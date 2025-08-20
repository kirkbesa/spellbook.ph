// src/components/common/BackButton.tsx
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
    fallbackTo?: string
    label?: string
    className?: string
}

export default function BackButton({ fallbackTo = '/binders', label = 'Back', className }: Props) {
    const navigate = useNavigate()

    const onClick = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            // If the user actually navigated here, go back
            window.history.back()
        } else {
            // Opened directly (new tab/deep link) — go to a safe route
            navigate({ to: fallbackTo })
        }
    }

    return (
        <Button
            variant='ghost'
            size='sm'
            onClick={onClick}
            className={className}
            aria-label={label}
        >
            <ArrowLeft className='mr-2 h-4 w-4' />
            {label}
        </Button>
    )
}
