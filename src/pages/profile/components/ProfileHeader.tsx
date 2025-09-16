import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, MapPin, ShieldX, Star } from 'lucide-react'
import type { Profile } from '../types'
import AvatarUploader from './AvatarUploader'
import { toast } from 'sonner'
import VerifiedBadge from '@/components/layout/VerifiedBadge'

type Props = {
    profile: Profile
    onAvatarUploaded: (url: string) => Promise<void> | void
}

export default function ProfileHeader({ profile, onAvatarUploaded }: Props) {
    const verified = Boolean(profile.isverified)
    const displayName = [profile.first_name ?? '', profile.last_name ?? '']
        .filter(Boolean)
        .join(' ')
    const nameOrUsername = (displayName || profile.username || '—').trim()

    return (
        <Card className='overflow-hidden'>
            <CardContent className='flex items-center gap-4'>
                <AvatarUploader
                    userId={profile.id}
                    url={profile.image_url}
                    size={80}
                    onUploaded={async (url) => {
                        try {
                            await onAvatarUploaded(url)
                            toast.success('Avatar updated')
                        } catch (e) {
                            toast.error(e instanceof Error ? e.message : 'Failed to update avatar')
                        }
                    }}
                />
                <div className='flex-1'>
                    <div className='flex flex-wrap items-center gap-2'>
                        <h1 className='text-xl font-semibold'>{nameOrUsername}</h1>
                        {verified ? (
                            <VerifiedBadge isVerified={verified} />
                        ) : (
                            <Badge variant='secondary' className='gap-1'>
                                <ShieldX size={14} />
                                Not yet verified
                            </Badge>
                        )}
                    </div>
                    <div className='mt-1 flex flex-wrap items-center gap-4 text-sm text-muted-foreground'>
                        {profile.username && <span>@{profile.username}</span>}
                        {profile.email && (
                            <span className='inline-flex items-center gap-1'>
                                <Mail size={14} />
                                {profile.email}
                            </span>
                        )}
                        {profile.location && (
                            <span className='inline-flex items-center gap-1'>
                                <MapPin size={14} />
                                {profile.location}
                            </span>
                        )}
                        <span
                            className={`inline-flex items-center gap-1 ${(profile.reputation ?? 0) >= 0 ? 'text-amber-500' : 'text-red-500'}`}
                        >
                            <Star size={14} />
                            {profile.reputation ?? 0} rep
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
