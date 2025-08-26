// src/pages/chats/ChatsPage.tsx
import * as React from 'react'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useConversations } from '@/hooks/chat/useConversations'
import { startConversationByUsername } from '@/hooks/chat/useStartConversation'
import { useConversationParticipants } from '@/hooks/chat/useConversationParticipants'
import { markConversationRead } from '@/hooks/chat/markRead'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import UserSearchBox from './UserSearchBox'
import { toast } from 'sonner'

// ---------- helpers (time + grouping) ----------
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

// ---------- types ----------
type MessageRow = {
    id: number
    content: string | null
    conversation_id: string
    sender_id: string
    created_at: string
}

const PAGE_SIZE = 30

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

    // ---------- paged messages + realtime ----------
    const [messages, setMessages] = React.useState<MessageRow[]>([])
    const [hasMore, setHasMore] = React.useState(true)
    const [loadingInitial, setLoadingInitial] = React.useState(false)
    const [loadingOlder, setLoadingOlder] = React.useState(false)

    const ids = React.useRef<Set<number>>(new Set())
    const listRef = React.useRef<HTMLDivElement | null>(null)
    const bottomRef = React.useRef<HTMLDivElement | null>(null)

    const loadLatest = React.useCallback(async (convId: string) => {
        setLoadingInitial(true)
        ids.current.clear()
        const { data, error } = await supabase
            .from('messages')
            .select('id, content, conversation_id, sender_id, created_at')
            .eq('conversation_id', convId)
            .order('id', { ascending: false })
            .limit(PAGE_SIZE)

        setLoadingInitial(false)
        if (error) {
            toast.error('Failed to load messages')
            return
        }

        const list = (data ?? []).reverse() as MessageRow[]
        list.forEach((m) => ids.current.add(m.id))
        setMessages(list)
        setHasMore((data?.length ?? 0) === PAGE_SIZE)

        // scroll to bottom after initial load
        requestAnimationFrame(() =>
            bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
        )
    }, [])

    const loadOlder = React.useCallback(async () => {
        if (!active || loadingOlder || !hasMore) return
        const first = messages[0]
        if (!first) return

        const container = listRef.current
        const prevHeight = container?.scrollHeight ?? 0
        const prevTop = container?.scrollTop ?? 0

        setLoadingOlder(true)
        const { data, error } = await supabase
            .from('messages')
            .select('id, content, conversation_id, sender_id, created_at')
            .eq('conversation_id', active)
            .lt('id', first.id)
            .order('id', { ascending: false })
            .limit(PAGE_SIZE)

        setLoadingOlder(false)
        if (error) return

        const older = (data ?? []).reverse() as MessageRow[]
        const filtered = older.filter((m) => !ids.current.has(m.id))
        filtered.forEach((m) => ids.current.add(m.id))
        if (filtered.length) {
            setMessages((cur) => [...filtered, ...cur])
            setHasMore((data?.length ?? 0) === PAGE_SIZE)
            requestAnimationFrame(() => {
                const nowHeight = container?.scrollHeight ?? 0
                const delta = nowHeight - prevHeight
                if (container) container.scrollTop = prevTop + delta
            })
        } else {
            setHasMore((data?.length ?? 0) === PAGE_SIZE)
        }
    }, [active, hasMore, loadingOlder, messages])

    // switch conversation
    React.useEffect(() => {
        if (!active) {
            setMessages([])
            setHasMore(true)
            return
        }
        loadLatest(active)
    }, [active, loadLatest])

    // realtime: append new messages at the bottom
    React.useEffect(() => {
        if (!active) return
        const channel = supabase
            .channel(`messages:${active}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${active}`,
                },
                (payload) => {
                    const m = payload.new as MessageRow
                    if (!ids.current.has(m.id)) {
                        ids.current.add(m.id)
                        setMessages((cur) => [...cur, m])

                        // auto scroll if near bottom
                        const el = listRef.current
                        if (el) {
                            const nearBottom =
                                el.scrollHeight - el.scrollTop - el.clientHeight < 120
                            if (nearBottom) {
                                requestAnimationFrame(() =>
                                    bottomRef.current?.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'end',
                                    })
                                )
                            }
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [active])

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
            return `${formatDateLabel(iso)} • ${formatTime(iso)}`
        }
        return `${formatDateLabel(iso)}`
    }

    // seen logic: show "Seen ✓✓" only on your last consecutive message that peer has read
    const shouldShowSeen = React.useCallback(
        (idx: number) => {
            const m = messages[idx]
            const next = messages[idx + 1]
            if (!me || !peerPart) return false
            if (!m || m.sender_id !== me) return false
            const peerReadId = peerPart.last_read_message_id ?? 0
            const thisRead = peerReadId >= m.id
            const nextAlsoMineAndRead = next && next.sender_id === me && peerReadId >= next.id
            return thisRead && !nextAlsoMineAndRead
        },
        [messages, me, peerPart]
    )

    // scroll handler (load older on top)
    const onScroll = React.useCallback(async () => {
        const el = listRef.current
        if (!el || loadingOlder || !hasMore) return
        if (el.scrollTop <= 80) {
            await loadOlder()
        }
    }, [loadOlder, loadingOlder, hasMore])

    // send message (INCLUDES sender_id to satisfy RLS)
    const send = React.useCallback(
        async (text: string) => {
            if (!active || !me) return
            const { error } = await supabase
                .from('messages')
                .insert({ conversation_id: active, content: text, sender_id: me })
            if (error) throw new Error(error.message)
        },
        [active, me]
    )

    return (
        <div
            className='grid min-h-[calc(100dvh-120px)] max-h-[calc(100dvh-120px)] grid-cols-12 gap-4'
            style={{ contain: 'layout paint size' }} // helps some browsers with overflow performance
        >
            {/* Sidebar */}
            <aside className='col-span-4 md:col-span-3 rounded-lg border p-3 flex min-h-0 flex-col'>
                <UserSearchBox myUserId={me ?? undefined} onPick={startWithUser} />

                <div className='mt-3 flex-1 min-h-0 overflow-auto space-y-1'>
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
            <section className='col-span-8 md:col-span-9 rounded-lg border flex min-h-0 flex-col'>
                <div className='border-b p-3 text-sm font-medium'>
                    {activePeer ? `@${activePeer.username}` : 'Conversation'}
                </div>

                {/* Scrollable list with lazy load on top */}
                <div
                    ref={listRef}
                    className='flex-1 min-h-0 overflow-auto p-3 space-y-4'
                    onScroll={onScroll}
                >
                    {loadingInitial ? (
                        <div className='text-sm text-muted-foreground'>Loading…</div>
                    ) : messages.length === 0 ? (
                        <div className='text-sm text-muted-foreground'>Say hello 👋</div>
                    ) : (
                        <>
                            {hasMore && (
                                <div className='flex justify-center'>
                                    <span className='rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'>
                                        Scroll up to load older…
                                    </span>
                                </div>
                            )}

                            {groupByDay(messages).map(({ label, items }) => (
                                <div key={label} className='space-y-2'>
                                    <div className='sticky top-0 z-10 flex justify-center'>
                                        <span className='rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground'>
                                            {label}
                                        </span>
                                    </div>
                                    {items.map((m) => {
                                        const idx = messages.findIndex((x) => x.id === m.id)
                                        const mine = m.sender_id === me
                                        return (
                                            <div
                                                key={m.id}
                                                className={cn(
                                                    'max-w-[45%] rounded-lg px-3 py-2 text-sm',
                                                    mine
                                                        ? 'ml-auto bg-primary text-primary-foreground'
                                                        : 'mr-auto bg-muted'
                                                )}
                                            >
                                                {m.content}
                                                <div className='mt-1 flex items-center gap-2 text-[10px] opacity-70'>
                                                    {formatTime(m.created_at)}
                                                    {mine && shouldShowSeen(idx) && (
                                                        <span className='inline-flex items-center gap-1'>
                                                            Seen ✓✓
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                            <div ref={bottomRef} />
                        </>
                    )}
                </div>

                {/* Composer */}
                <Composer
                    disabled={!active}
                    onSend={async (text) => {
                        if (!text.trim()) return
                        try {
                            await send(text) // includes sender_id now
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
