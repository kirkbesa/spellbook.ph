import { useProfile } from '@/hooks/profile/useProfile'

const ProfilePage = () => {
    const { profile, loading, error, updateProfile } = useProfile()
    console.log('-------- PROFILE --------')
    console.log(profile)
    console.log('-------- LOADING --------')
    console.log(loading)
    console.log('-------- ERROR --------')
    console.log(error)

    return <div>Profile Page</div>
}

export default ProfilePage
