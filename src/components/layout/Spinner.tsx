// src/components/layout/Spinner.tsx
import { Loader2 } from 'lucide-react'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeMap: Record<Size, string> = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
}

export type SpinnerProps = {
    size?: Size
    label?: string
    className?: string
    /** Show label text next to the spinner (defaults to true if label provided) */
    showLabel?: boolean
}

export function Spinner({ size = 'md', label = 'Loading…', className, showLabel }: SpinnerProps) {
    const show = showLabel ?? !!label
    const iconClass = ['animate-spin text-muted-foreground', sizeMap[size], className]
        .filter(Boolean)
        .join(' ')

    return (
        <div role='status' aria-live='polite' className='inline-flex items-center gap-2'>
            <Loader2 className={iconClass} aria-hidden='true' />
            {show ? (
                <span className='text-sm text-muted-foreground'>{label}</span>
            ) : (
                <span className='sr-only'>{label}</span>
            )}
        </div>
    )
}

/** Centers a spinner in a block (nice for page/content loading states). */
export function SpinnerCentered(props: Omit<SpinnerProps, 'className'>) {
    return (
        <div className='grid min-h-[50vh] place-items-center'>
            <Spinner {...props} />
        </div>
    )
}

/** Fullscreen overlay spinner (use when saving or blocking the whole UI). */
export function SpinnerOverlay(props: Omit<SpinnerProps, 'className'>) {
    return (
        <div className='fixed inset-0 z-50 grid place-items-center bg-background/60 backdrop-blur-sm'>
            <Spinner {...props} />
        </div>
    )
}

/** Small spinner for placing inside buttons/toolbars. */
export function ButtonSpinner() {
    return <Loader2 className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />
}
