import { Card } from '@/components/ui/card'
import { Link } from '@tanstack/react-router'
import { FolderClosed, Plus } from 'lucide-react'

const BindersPage = () => {
    return (
        <div className='max-w-fit space-y-4'>
            <h1 className='font-bold text-2xl'>My Binders</h1>
            <Link to='/binders/create'>
                <Card className='flex flex-row gap-6 items-center justify-center p-14 hover:scale-105 transition-all'>
                    <FolderClosed size={48} />
                    <Plus size={32} />
                </Card>
            </Link>
        </div>
    )
}

export default BindersPage
