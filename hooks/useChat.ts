'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { Database } from '@/lib/database.types'

type Message = Database['public']['Tables']['messages']['Row'] & {
  sender?: Database['public']['Tables']['users']['Row']
}

export function useChat(eventId: string, userId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isAttendee, setIsAttendee] = useState(false)
  const supabase = getSupabaseClient()
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!userId) return

    const checkAttendee = async () => {
      const { data } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single()
      setIsAttendee(!!data)
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:users!user_id(*)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
      setMessages((data ?? []) as Message[])
      setLoading(false)
    }

    checkAttendee()
    fetchMessages()

    // Realtime subscription for messages
    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `event_id=eq.${eventId}`,
      }, async (payload) => {
        const { data: sender } = await supabase
          .from('users')
          .select('*')
          .eq('id', payload.new.user_id)
          .single()
        setMessages(prev => [...prev, { ...payload.new, sender } as Message])
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== userId) {
          setTypingUsers(prev => {
            if (!prev.includes(payload.payload.username)) {
              return [...prev, payload.payload.username]
            }
            return prev
          })
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u !== payload.payload.username))
          }, 2500)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [eventId, userId, supabase])

  const sendMessage = async (content: string) => {
    if (!userId || !isAttendee || !content.trim()) return false
    const { error } = await supabase
      .from('messages')
      .insert({ event_id: eventId, user_id: userId, content: content.trim() })
    return !error
  }

  const broadcastTyping = useCallback(async (username: string) => {
    if (!userId) return
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    const channel = supabase.channel(`event-chat-${eventId}`)
    await channel.send({ type: 'broadcast', event: 'typing', payload: { userId, username } })
  }, [supabase, eventId, userId])

  return { messages, loading, isAttendee, typingUsers, sendMessage, broadcastTyping }
}
