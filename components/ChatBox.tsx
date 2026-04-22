'use client'
import { useState, useRef, useEffect } from 'react'
import { useChat } from '@/hooks/useChat'
import { formatRelativeTime } from '@/lib/utils'
import { Send, Lock, MessageCircle } from 'lucide-react'

interface ChatBoxProps {
  eventId: string
  userId?: string
  userProfile?: { username: string; avatar_url: string | null }
}

export default function ChatBox({ eventId, userId, userProfile }: ChatBoxProps) {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { messages, loading, isAttendee, typingUsers, sendMessage, broadcastTyping } = useChat(eventId, userId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    setSending(true)
    await sendMessage(input)
    setInput('')
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    if (userProfile?.username) broadcastTyping(userProfile.username)
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Lock size={32} className="text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-medium">Sign in to join the conversation</p>
      </div>
    )
  }

  if (!isAttendee) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageCircle size={32} className="text-muted-foreground mb-3" />
        <p className="font-medium mb-1">Join this event to chat</p>
        <p className="text-sm text-muted-foreground">Only attendees can send messages</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-2 animate-pulse">
                <div className="w-8 h-8 rounded-full skeleton flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 skeleton rounded" />
                  <div className="h-4 w-48 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No messages yet. Be the first to say hi! 👋
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.user_id === userId
          const showAvatar = !isOwn && (i === 0 || messages[i - 1]?.user_id !== msg.user_id)
          return (
            <div key={msg.id} className={`flex gap-2.5 items-end ${isOwn ? 'flex-row-reverse' : ''} animate-fade-in`}>
              {!isOwn && (
                <div className="w-7 h-7 flex-shrink-0">
                  {showAvatar && (
                    msg.sender?.avatar_url
                      ? <img src={msg.sender.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />
                      : <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {msg.sender?.username?.[0]?.toUpperCase() ?? '?'}
                        </div>
                  )}
                </div>
              )}
              <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {showAvatar && !isOwn && (
                  <span className="text-xs font-medium text-muted-foreground px-1">{msg.sender?.username}</span>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                  isOwn
                    ? 'gradient-brand text-white rounded-br-sm'
                    : 'bg-secondary text-secondary-foreground rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground px-1">{formatRelativeTime(msg.created_at)}</span>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-fade-in">
            <div className="flex gap-0.5 items-center">
              {[0, 1, 2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-pulse-dot" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2 items-center bg-secondary rounded-2xl px-4 py-2.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-8 h-8 gradient-brand rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all active:scale-95 flex-shrink-0"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
