// src/pages/chats/ChatsPage.tsx
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useConversations } from '@/hooks/chat/useConversations'
import { useMessages } from '@/hooks/chat/useMessages'
import { startConversationByUsername } from '@/hooks/chat/useStartConversation'
import { useConversationParticipants } from '@/hooks/chat/useConversationParticipants'
import { markConversationRead } from '@/hooks/chat/markRead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import UserSearchBox from './UserSearchBox'
import { toast } from 'sonner'

function formatTime(ts: string | number | Date) {
    const d = new Date(ts)
    const hours = d.getHours()
    const h12 = hours % 12 || 12
    const mins = d.getMinutes().toString().padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    return `${h12}:${mins} ${ampm}`
}

function sameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

function isYesterday(d: Date) {
    const y = new Date()
    y.setDate(y.getDate() - 1)
    return sameDay(d, y)
}

function formatDateLabel(ts: string) {
    const d = new Date(ts)
    const now = new Date()
    if (sameDay(d, now)) return 'Today'
    if (isYesterday(d)) return 'Yesterday'
    const mm = (d.getMonth() + 1).toString().padStart(2, '0')
    const dd = d.getDate().toString().padStart(2, '0')
    const yy = d.getFullYear().toString().slice(-2)
    return `${mm}/${dd}/${yy}`
}

function groupByDay<T extends { created_at: string }>(msgs: T[]) {
    const out: Array<{ label: string; items: T[] }> = []
    for (const m of msgs) {
        const label = formatDateLabel(m.created_at)
        const last = out[out.length - 1]
        if (!last || last.label !== label) out.push({ label, items: [m] })
        else last.items.push(m)
    }
    return out
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

    // messages for active
    const { messages, loading: loadingMsgs, send } = useMessages(active)

    // pick most recent conversation if none selected
    React.useEffect(() => {
        if (!convs?.length) return
        if (active && convs.some((c) => c.id === active)) return
        const sorted = [...convs].sort((a, b) => {
            const ta = a.last_message_at ? Date.parse(a.last_message_at) : 0
            const tb = b.last_message_at ? Date.parse(b.last_message_at) : 0
            return tb - ta
        })
        if (sorted.length) setActive(sorted[0].id)
    }, [convs, active])

    // active conversation + peer
    const activeConv = React.useMemo(
        () => convs.find((c) => c.id === active) ?? null,
        [convs, active]
    )
    const activePeer = React.useMemo(
        () => (activeConv ? peerOf(activeConv) : null),
        [activeConv, peerOf]
    )

    // participants (for read receipts)
    const { participants } = useConversationParticipants(active)
    const peerPart = React.useMemo(() => {
        if (!participants?.length || !me) return null
        return participants.find((p) => p.user_id !== me) ?? null
    }, [participants, me])

    // auto-scroll
    const endRef = React.useRef<HTMLDivElement | null>(null)
    React.useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [messages.length, active])

    // mark read whenever viewing messages
    React.useEffect(() => {
        if (!me || !active || messages.length === 0) return
        const latest = messages[messages.length - 1]?.id
        markConversationRead({
            conversationId: active,
            myUserId: me,
            latestMessageId: latest,
        }).catch(() => {})
    }, [me, active, messages.length])

    const startWithUser = async (uname: string) => {
        try {
            const convId = await startConversationByUsername(uname)
            setActive(convId)
            await refreshConvs()
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to start conversation'
            toast.error(msg)
        }
    }

    // sidebar item: last message time label
    function lastMsgWhenLabel(iso?: string | null) {
        if (!iso) return 'No messages yet'
        const d = new Date(iso)
        const now = new Date()
        if (sameDay(d, now) || isYesterday(d)) {
            // Show Today/Yesterday + time
            return `${formatDateLabel(iso)} • ${formatTime(iso)}`
        }
        return `${formatDateLabel(iso)}`
    }

    // read receipt logic: show "Seen ✓✓" only on your last sent message in a row
    function shouldShowSeen(i: number) {
        const m = messages[i]
        const next = messages[i + 1]
        if (!me || !peerPart) return false
        if (!m || m.sender_id !== me) return false
        const peerReadId = peerPart.last_read_message_id ?? 0
        const thisRead = peerReadId >= m.id
        const nextAlsoMineAndRead = next && next.sender_id === me && peerReadId >= next.id
        return thisRead && !nextAlsoMineAndRead
    }

    return (
        <div className='grid h-[calc(100vh-120px)] grid-cols-12 gap-4'>
            {/* Sidebar */}
            <aside className='col-span-4 md:col-span-3 rounded-lg border p-3 flex flex-col'>
                <UserSearchBox myUserId={me ?? undefined} onPick={startWithUser} />

                <div className='mt-3 flex-1 overflow-auto space-y-1'>
                    {loadingConvs ? (
                        <div className='text-sm text-muted-foreground'>Loading…</div>
                    ) : convs.length === 0 ? (
                        <div className='text-sm text-muted-foreground'>No conversations yet</div>
                    ) : (
                        [...convs]
                            .sort((a, b) => {
                                const ta = a.last_message_at ? Date.parse(a.last_message_at) : 0
                                const tb = b.last_message_at ? Date.parse(b.last_message_at) : 0
                                return tb - ta
                            })
                            .map((c) => {
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
                                                    {lastMsgWhenLabel(c.last_message_at)}
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

                <div className='flex-1 overflow-auto p-3 space-y-4'>
                    {loadingMsgs ? (
                        <div className='text-sm text-muted-foreground'>Loading…</div>
                    ) : messages.length === 0 ? (
                        <div className='text-sm text-muted-foreground'>Say hello 👋</div>
                    ) : (
                        groupByDay(messages).map(({ label, items }) => (
                            <div key={label} className='space-y-2'>
                                <div className='sticky top-0 z-10 flex justify-center'>
                                    <span className='rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'>
                                        {label}
                                    </span>
                                </div>
                                {items.map((m) => {
                                    // global index for seen check: compute index in full messages array
                                    const globalIdx = messages.findIndex((x) => x.id === m.id)
                                    const mine = m.sender_id === me
                                    return (
                                        <div
                                            key={m.id}
                                            className={cn(
                                                'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                                                mine
                                                    ? 'ml-auto bg-primary text-primary-foreground'
                                                    : 'mr-auto bg-muted'
                                            )}
                                        >
                                            {m.content}
                                            <div className='mt-1 flex items-center gap-2 text-[10px] opacity-70'>
                                                {formatTime(m.created_at)}
                                                {mine && shouldShowSeen(globalIdx) && (
                                                    <span className='inline-flex items-center gap-1'>
                                                        Seen ✓✓
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ))
                    )}
                    <div ref={endRef} />
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
