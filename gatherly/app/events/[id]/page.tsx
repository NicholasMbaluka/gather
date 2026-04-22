'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, MapPin, Users, ArrowLeft, Share2, Zap, MessageCircle, UserPlus, Star } from 'lucide-react'
import { useEvent } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import { getSupabaseClient } from '@/lib/supabase-client'
import ChatBox from '@/components/ChatBox'
import UserCard from '@/components/UserCard'
import RatingModal from '@/components/RatingModal'
import FeaturedModal from '@/components/FeaturedModal'
import { formatDate, getCategoryLabel } from '@/lib/utils'
import { ProfileSkeleton } from '@/components/Skeleton'
import toast from 'react-hot-toast'

export default function EventDetailPage() {
  const { id } = useParams() as { id: string }
  const { user, profile } = useAuth()
  const { event, attendees, loading } = useEvent(id)
  const [isAttending, setIsAttending] = useState(false)
  const [joining, setJoining] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'chat' | 'people'>('about')
  const [connections, setConnections] = useState<Record<string, string>>({})
  const [ratingTarget, setRatingTarget] = useState<(typeof attendees)[0] | null>(null)
  const [showFeaturedModal, setShowFeaturedModal] = useState(false)
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (user && attendees.length > 0) {
      setIsAttending(attendees.some(a => a.id === user.id))
      fetchConnections()
    }
  }, [user, attendees])

  const fetchConnections = async () => {
    if (!user) return
    const { data } = await supabase
      .from('connections')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    const map: Record<string, string> = {}
    data?.forEach(c => {
      const other = c.user1_id === user.id ? c.user2_id : c.user1_id
      map[other] = c.user1_id === user.id ? (c.status === 'pending' ? 'sent' : c.status) : c.status
    })
    setConnections(map)
  }

  const handleJoin = async () => {
    if (!user) { toast.error('Sign in to join events'); return }
    setJoining(true)
    const { error } = await supabase.from('event_attendees').insert({ event_id: id, user_id: user.id })
    if (error) {
      if (error.code === '23505') toast.error('Already joined!')
      else toast.error('Failed to join')
    } else {
      setIsAttending(true)
      toast.success('🎉 You joined the event!')
    }
    setJoining(false)
  }

  const handleLeave = async () => {
    if (!user) return
    await supabase.from('event_attendees').delete().eq('event_id', id).eq('user_id', user.id)
    setIsAttending(false)
    toast.success('Left event')
  }

  const handleConnect = async (targetUserId: string) => {
    if (!user) return
    const { error } = await supabase.from('connections').insert({
      user1_id: user.id,
      user2_id: targetUserId,
      status: 'pending',
    })
    if (error && error.code !== '23505') { toast.error('Failed to send connection'); return }
    toast.success('Connection request sent!')
    setConnections(prev => ({ ...prev, [targetUserId]: 'sent' }))
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: event?.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-56 skeleton rounded-3xl" />
        <ProfileSkeleton />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">😕</div>
        <h2 className="font-display text-2xl font-bold mb-2">Event not found</h2>
        <Link href="/events" className="text-primary hover:underline">Browse events</Link>
      </div>
    )
  }

  const isCreator = user?.id === event.created_by

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} />Back to events
      </Link>

      {/* Hero */}
      <div className="relative h-56 sm:h-72 rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-orange-600">
        {event.image_url && <img src={event.image_url} className="absolute inset-0 w-full h-full object-cover" alt="" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex items-center gap-2 mb-2">
            {event.featured && (
              <div className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                <Zap size={10} fill="currentColor" />Featured
              </div>
            )}
            <div className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {getCategoryLabel(event.category)}
            </div>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">{event.title}</h1>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={handleShare} className="p-2.5 rounded-xl bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition-all">
            <Share2 size={18} />
          </button>
          {isCreator && !event.featured && (
            <button onClick={() => setShowFeaturedModal(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/90 backdrop-blur-sm text-white text-sm font-semibold hover:bg-amber-500 transition-all">
              <Zap size={14} />Boost
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-secondary rounded-2xl p-1">
            {(['about', 'chat', 'people'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${
                  activeTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'chat' && <MessageCircle size={14} />}
                {tab === 'people' && <Users size={14} />}
                {tab}
                {tab === 'people' && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{attendees.length}</span>}
              </button>
            ))}
          </div>

          {/* About tab */}
          {activeTab === 'about' && (
            <div className="bg-card border border-border rounded-3xl p-5 space-y-4 animate-fade-in">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{formatDate(event.date)}</div>
                    <div className="text-muted-foreground text-xs">Event date & time</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{event.location}</div>
                    <div className="text-muted-foreground text-xs">Venue</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{attendees.length} {event.max_attendees ? `/ ${event.max_attendees}` : ''} attending</div>
                    <div className="text-muted-foreground text-xs">{event.max_attendees ? `${event.max_attendees - attendees.length} spots left` : 'Open event'}</div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div>
                <h3 className="font-semibold mb-2">About this event</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>

              {/* Organizer */}
              {(event as { creator?: { id: string; username: string; avatar_url?: string } }).creator && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <h3 className="font-semibold mb-2 text-sm">Organized by</h3>
                    <Link href={`/profile/${(event as { creator?: { id: string } }).creator?.id}`} className="flex items-center gap-2.5 group">
                      {(event as { creator?: { avatar_url?: string; username?: string } }).creator?.avatar_url
                        ? <img src={(event as { creator?: { avatar_url?: string } }).creator?.avatar_url!} className="w-9 h-9 rounded-full object-cover" alt="" />
                        : <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white font-bold text-sm">{(event as { creator?: { username?: string } }).creator?.username?.[0]?.toUpperCase()}</div>
                      }
                      <div>
                        <div className="font-semibold text-sm group-hover:text-primary transition-colors">{(event as { creator?: { username?: string } }).creator?.username}</div>
                        <div className="text-xs text-muted-foreground">Event organizer</div>
                      </div>
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <div className="bg-card border border-border rounded-3xl overflow-hidden h-[480px] flex flex-col animate-fade-in">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle size={16} className="text-primary" />
                  Event Chat
                  {!isAttending && <span className="text-xs text-muted-foreground font-normal">(join to chat)</span>}
                </h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatBox eventId={id} userId={user?.id} userProfile={profile ? { username: profile.username, avatar_url: profile.avatar_url } : undefined} />
              </div>
            </div>
          )}

          {/* People tab */}
          {activeTab === 'people' && (
            <div className="bg-card border border-border rounded-3xl p-5 animate-fade-in">
              <h3 className="font-semibold mb-4">Attendees ({attendees.length})</h3>
              {attendees.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No attendees yet. Be the first to join!</p>
              ) : (
                <div className="space-y-2">
                  {attendees.map(attendee => (
                    <div key={attendee.id} className="flex items-center gap-2">
                      <div className="flex-1">
                        <UserCard
                          user={attendee}
                          connectionStatus={connections[attendee.id] as 'none' | 'pending' | 'accepted' | 'sent' ?? 'none'}
                          onConnect={handleConnect}
                          currentUserId={user?.id}
                        />
                      </div>
                      {isAttending && user && attendee.id !== user.id && (
                        <button
                          onClick={() => setRatingTarget(attendee)}
                          className="flex-shrink-0 p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-muted-foreground hover:text-amber-500 transition-colors"
                          title="Rate this person"
                        >
                          <Star size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Join/Leave */}
          <div className="bg-card border border-border rounded-3xl p-5 space-y-4">
            <div className="flex -space-x-2">
              {attendees.slice(0, 6).map(a => (
                a.avatar_url
                  ? <img key={a.id} src={a.avatar_url} className="w-9 h-9 rounded-full object-cover border-2 border-card" alt="" />
                  : <div key={a.id} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-orange-600 border-2 border-card flex items-center justify-center text-white text-xs font-bold">{a.username[0]?.toUpperCase()}</div>
              ))}
              {attendees.length > 6 && (
                <div className="w-9 h-9 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-xs font-bold text-muted-foreground">+{attendees.length - 6}</div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {attendees.length === 0 ? 'Be the first to join!' : `${attendees.length} ${attendees.length === 1 ? 'person' : 'people'} going`}
            </p>

            {user ? (
              isAttending ? (
                <div className="space-y-2">
                  <div className="w-full py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold rounded-2xl text-center text-sm">
                    ✓ You're going!
                  </div>
                  <button onClick={handleLeave} className="w-full py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all">
                    Leave event
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={joining || (!!event.max_attendees && attendees.length >= event.max_attendees)}
                  className="w-full py-3.5 gradient-brand text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all active:scale-[0.98]"
                >
                  {joining ? 'Joining...' : event.max_attendees && attendees.length >= event.max_attendees ? 'Event Full' : 'Join Event →'}
                </button>
              )
            ) : (
              <Link href="/login" className="block w-full py-3.5 gradient-brand text-white font-bold rounded-2xl hover:opacity-90 transition-all text-center">
                Sign in to Join
              </Link>
            )}
          </div>

          {/* Quick chat preview */}
          {isAttending && (
            <button
              onClick={() => setActiveTab('chat')}
              className="w-full bg-card border border-border rounded-3xl p-4 text-left card-hover group"
            >
              <div className="flex items-center gap-2 text-sm font-semibold mb-1 group-hover:text-primary transition-colors">
                <MessageCircle size={15} />
                Open group chat
              </div>
              <p className="text-xs text-muted-foreground">Chat with other attendees in real-time</p>
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {ratingTarget && user && (
        <RatingModal
          open={!!ratingTarget}
          onClose={() => setRatingTarget(null)}
          fromUserId={user.id}
          toUser={ratingTarget}
          eventId={id}
        />
      )}
      {showFeaturedModal && user && (
        <FeaturedModal
          open={showFeaturedModal}
          onClose={() => setShowFeaturedModal(false)}
          eventId={id}
          eventTitle={event.title}
          userId={user.id}
        />
      )}
    </div>
  )
}
