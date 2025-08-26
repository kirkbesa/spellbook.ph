import { MailCheck, MoveRight } from 'lucide-react'

const EmailConfirmation = ({ email }: { email?: string }) => {
    return (
        <div className='text-center flex gap-2 items-center justify-center flex-col'>
            <MailCheck size={64} className='text-green-600' />
            <h1 className='text-2xl font-bold text-green-600'>Registration Success</h1>
            <p className='text-green-700'>
                We sent a verification link to{' '}
                <span className='font-medium'>{email || 'your inbox'}</span>. Click it to confirm
                your account.
            </p>
            <a href='https://mail.google.com/' target='_blank' rel='noreferrer' className='mt-4'>
                <div className='flex gap-2 items-center text-muted-foreground text-xs cursor-pointer hover:border-b'>
                    <span>Go to gmail.com</span> <MoveRight size={16} />
                </div>
            </a>
        </div>
    )
}

export default EmailConfirmation
