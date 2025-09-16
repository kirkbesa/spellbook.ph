import { BadgeCheck } from 'lucide-react'
import { Badge } from '../ui/badge'

type Props = {
    isVerified: boolean
}

const VerifiedBadge = ({ isVerified }: Props) => {
    return (
        isVerified && (
            <>
                <Badge className='hidden sm:flex gap-1 bg-blue-500 text-white dark:bg-blue-600'>
                    <BadgeCheck size={14} />
                    <span className=''>Verified</span>
                </Badge>
                <BadgeCheck className='w-5 h-5 text-blue-500 sm:hidden' />
            </>
        )
    )
}

export default VerifiedBadge
