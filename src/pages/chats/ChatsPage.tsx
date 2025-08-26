import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useConversations } from '@/hooks/chat/useConversations'
import { useMessages } from '@/hooks/chat/useMessages'
import { startConversationByUsername } from '@/hooks/chat/useStartConversation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import UserSearchBox from './UserSearchBox'
import { toast } from 'sonner'

// top of ChatsPage.tsx (under imports)
function formatTime(input: string | number | Date) {
    const d = new Date(input)
    let h = d.getHours()
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12
    if (h === 0) h = 12
    const hh = String(h).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm} ${ampm}`
}

function formatDateLabel(input: string | number | Date) {
    const d = new Date(input)
    const now = new Date()

    const sameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()

    if (sameDay(d, now)) return 'Today'

    const yest = new Date(now)
    yest.setDate(now.getDate() - 1)
    if (sameDay(d, yest)) return 'Yesterday'

    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(-2)
    return `${mm}/${dd}/${yy}`
}

export default function ChatsPage() {
    const [me, setMe] = React.useState<string | null>(null)
    const [active, setActive] = React.useState<string | null>(null)

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null))
    }, [])

    const {
        convs,
        loading: loadingConvs,
        refresh: refreshConvs,
        peerOf,
    } = useConversations(me ?? undefined)
    const { messages, loading: loadingMsgs, send } = useMessages(active)

    // pick the most recent conversation when convs change (if none active)
    React.useEffect(() => {
        if (!convs?.length) return
        if (active && convs.some((c) => c.id === active)) return
        const sorted = [...convs].sort((a, b) => {
            const ta = a.last_message_at ? Date.parse(a.last_message_at) : 0
            const tb = b.last_message_at ? Date.parse(b.last_message_at) : 0
            return tb - ta
        })
        setActive(sorted[0].id)
    }, [convs, active])

    // compute active peer once
    const activeConv = React.useMemo(
        () => convs.find((c) => c.id === active) ?? null,
        [convs, active]
    )
    const activePeer = React.useMemo(
        () => (activeConv ? peerOf(activeConv) : null),
        [activeConv, peerOf]
    )

    const messagesEndRef = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [messages.length, active])

    return (
        <div className='grid h-[calc(100vh-120px)] grid-cols-12 gap-4'>
            {/* Sidebar */}
            <aside className='col-span-4 md:col-span-3 rounded-lg border p-3 flex flex-col'>
                <UserSearchBox
                    myUserId={me ?? undefined}
                    onPick={async (uname) => {
                        try {
                            const convId = await startConversationByUsername(uname)
                            setActive(convId)
                            await refreshConvs()
                        } catch (e) {
                            console.log(e)
                            const msg =
                                e instanceof Error ? e.message : 'Failed to start conversation'
                            toast.error(msg)
                        }
                    }}
                />

                <div className='mt-3 flex-1 overflow-auto space-y-1'>
                    {loadingConvs ? (
                        <div className='text-sm text-muted-foreground'>Loading…</div>
                    ) : convs.length === 0 ? (
                        <div className='text-sm text-muted-foreground'>No conversations yet</div>
                    ) : (
                        convs.map((c) => {
                            const peer = peerOf(c)
                            return (
                                <button
                                    key={c.id}
                                    className={cn(
                                        'w-full rounded-md border px-3 py-2 text-left hover:bg-accent',
                                        active === c.id && 'bg-accent'
                                    )}
                                    onClick={() => setActive(c.id)}
                                >
                                    <div className='flex items-center gap-2'>
                                        <img
                                            src={peer?.image_url ?? ''}
                                            onError={(e) =>
                                                ((
                                                    e.currentTarget as HTMLImageElement
                                                ).style.display = 'none')
                                            }
                                            className='h-8 w-8 rounded-full border object-cover'
                                            alt=''
                                        />
                                        <div className='min-w-0'>
                                            <div className='truncate text-sm font-medium'>
                                                @{peer?.username ?? 'unknown'}
                                            </div>
                                            <div className='truncate text-xs text-muted-foreground'>
                                                {c.last_message_at
                                                    ? `${formatDateLabel(c.last_message_at)}, ${formatTime(c.last_message_at)}`
                                                    : 'No messages yet'}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </aside>

            {/* Chat panel */}
            <section className='col-span-8 md:col-span-9 rounded-lg border flex flex-col'>
                <div className='border-b p-3 text-sm font-medium'>
                    {activePeer ? `@${activePeer.username}` : 'Conversation'}
                </div>

                <div className='flex-1 overflow-auto p-3 space-y-2'>
                    {loadingMsgs ? (
                        <div className='text-sm text-muted-foreground'>Loading…</div>
                    ) : messages.length === 0 ? (
                        <div className='text-sm text-muted-foreground'>Say hello 👋</div>
                    ) : (
                        messages.map((m) => (
                            <div
                                key={m.id}
                                className={cn(
                                    'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                                    m.sender_id === me
                                        ? 'ml-auto bg-primary text-primary-foreground'
                                        : 'mr-auto bg-muted'
                                )}
                            >
                                {m.content}
                                <div className='mt-1 text-[10px] opacity-70'>
                                    {formatTime(m.created_at)}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Composer */}
                <Composer
                    disabled={!active}
                    onSend={async (text) => {
                        if (!text.trim()) return
                        try {
                            await send(text)
                        } catch (e) {
                            const msg = e instanceof Error ? e.message : 'Failed to send'
                            toast.error(msg)
                        }
                    }}
                />
            </section>
        </div>
    )
}

function Composer({
    disabled,
    onSend,
}: {
    disabled?: boolean
    onSend: (text: string) => void | Promise<void>
}) {
    const [text, setText] = React.useState('')
    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        const t = text
        if (!t.trim()) return
        setText('')
        await onSend(t)
    }
    return (
        <form onSubmit={submit} className='flex gap-2 border-t p-3'>
            <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Type a message…'
                disabled={disabled}
            />
            <Button type='submit' disabled={disabled || !text.trim()}>
                Send
            </Button>
        </form>
    )
}
