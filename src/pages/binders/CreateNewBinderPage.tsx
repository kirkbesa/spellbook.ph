// src/binders/CreateNewBinderPage.tsx
import { useNavigate } from '@tanstack/react-router'
import CreateBinderForm from './components/CreateBinderForm'
import type { Binder } from '@/hooks/binders/useCreateBinder'

const CreateNewBinderPage = () => {
    const navigate = useNavigate()

    function handleSuccess(binder: Binder) {
        // If you already have a route like /binders/$binderId, prefer navigate({ to: '/binders/$binderId', params: { binderId: binder.id } })
        navigate({ to: `/binders/${binder.id}` })
    }

    return (
        <div className='mx-auto w-full max-w-2xl'>
            <CreateBinderForm onSuccess={handleSuccess} />
        </div>
    )
}

export default CreateNewBinderPage
