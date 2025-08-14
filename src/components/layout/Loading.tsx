// src/components/Loading.tsx
import React from 'react'

interface LoadingProps {
    /** Text to display under the spinner */
    message?: string
}

const Loading: React.FC<LoadingProps> = ({ message = 'Loading…' }) => {
    return (
        <div className='fixed inset-0 z-50 flex flex-col items-center justify-center bg-white'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900 mb-4' />
            {message && <p className='text-gray-600 text-center'>{message}</p>}
        </div>
    )
}

export default Loading
