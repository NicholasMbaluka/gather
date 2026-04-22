'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { Database } from '@/lib/database.types'
import toast from 'react-hot-toast'

type Event = Database['public']['Tables']['events']['Row'] & {
  attendee_count?: number
  creator?: Database['public']['Tables']['users']['Row']
  is_attending?: boolean
}

interface EventFilters {
  category?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export function useEvents(filters?: EventFilters) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('events')
      .select(`*, creator:users!created_by(id, username, avatar_url), event_attendees(count)`)
      .order('featured', { ascending: false })
      .order('date', { ascending: true })

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    if (filters?.dateFrom) {
      query = query.gte('date', filters.dateFrom)
    }

    const { data, error } = await query
    if (error) { console.error(error); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    let attendingIds: string[] = []
    if (user) {
      const { data: attending } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('user_id', user.id)
      attendingIds = attending?.map(a => a.event_id) ?? []
    }

    const mapped = (data ?? []).map((e: Record<string, unknown>) => ({
      ...e,
      attendee_count: (e.event_attendees as { count: number }[])?.[0]?.count ?? 0,
      is_attending: attendingIds.includes(e.id as string),
    }))

    setEvents(mapped as Event[])
    setLoading(false)
  }, [supabase, filters?.category, filters?.search, filters?.dateFrom])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const joinEvent = async (eventId: string, userId: string) => {
    const { error } = await supabase
      .from('event_attendees')
      .insert({ event_id: eventId, user_id: userId })
    if (error) {
      if (error.code === '23505') toast.error('Already joined!')
      else toast.error('Failed to join event')
      return false
    }
    toast.success('🎉 Joined event!')
    fetchEvents()
    return true
  }

  const leaveEvent = async (eventId: string, userId: string) => {
    const { error } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)
    if (error) { toast.error('Failed to leave event'); return false }
    toast.success('Left event')
    fetchEvents()
    return true
  }

  return { events, loading, joinEvent, leaveEvent, refetch: fetchEvents }
}

export function useEvent(id: string) {
  const [event, setEvent] = useState<Event | null>(null)
  const [attendees, setAttendees] = useState<Database['public']['Tables']['users']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchEvent = async () => {
      const [{ data: eventData }, { data: attendeeData }] = await Promise.all([
        supabase.from('events').select('*, creator:users!created_by(*)').eq('id', id).single(),
        supabase.from('event_attendees').select('users(*)').eq('event_id', id),
      ])
      setEvent(eventData as Event)
      setAttendees((attendeeData ?? []).map((a: Record<string, unknown>) => a.users as Database['public']['Tables']['users']['Row']).filter(Boolean))
      setLoading(false)
    }
    fetchEvent()
  }, [id, supabase])

  return { event, attendees, loading }
}
