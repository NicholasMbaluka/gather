'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Star, Calendar, Users, Edit, ArrowLeft, Eye, UserPlus, UserCheck } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/useAuth'
import { Database } from '@/lib/database.types'
import PremiumModal from '@/components/PremiumModal'
import { ProfileSkeleton } from '@/components/Skeleton'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'

type Profile = Database['public']['Tables']['users']['Row']
type Event = Database['public']['Tables']['events']['Row']

export default function ProfilePage() {
  const { id } = useParams() as { id: string }
  const { user, profile: myProfile } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'sent' | 'accepted' | 'pending'>('none')
  const [connections, setConnections] = useState<Profile[]>([])
  const [profileViews, setProfileViews] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showPremium, setShowPremium] = useState(false)
  const [activeTab, setActiveTab] = useState<'events' | 'connections'>('events')
  const supabase = getSupabaseClient()

  const isSelf = user?.id === id

  useEffect(() => {
    fetchProfileData()
    if (user && user.id !== id) recordView()
  }, [id, user])

  const recordView = async () => {
    if (!user) return
    await supabase.from('profile_views').upsert({ viewer_id: user.id, profile_id: id }, { onConflict: 'viewer_id,profile_id' })
  }

  const fetchProfileData = async () => {
    setLoading(true)
    const [
      { data: profileData },
      { data: eventsData },
      { data: ratingsData },
      { data: viewsData },
      { data: connectionsData },
    ] = await Promise.all([
      supabase.from('users').select('*').eq('id', id).single(),
      supabase.from('event_attendees').select('events(*)').eq('user_id', id).limit(10),
      supabase.from('ratings').select('rating').eq('to_user', id),
      supabase.from('profile_views').select('id').eq('profile_id', id),
      supabase.from('connections').select('*, user1:users!user1_id(*), user2:users!user2_id(*)').or(`user1_id.eq.${id},user2_id.eq.${id}`).eq('status', 'accepted'),
    ])

    setProfile(profileData)
    setEvents((eventsData ?? []).map((e: Record<string, unknown>) => e.events as Event).filter(Boolean))
    setProfileViews(viewsData?.length ?? 0)

    if (ratingsData && ratingsData.length > 0) {
      const avg = ratingsData.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / ratingsData.length
      setAvgRating(avg)
      setRatingCount(ratingsData.length)
    }

    const connProfiles = (connectionsData ?? []).map((c: Record<string, unknown>) => {
      const u1 = c.user1 as Profile
      const u2 = c.user2 as Profile
      return u1.id === id ? u2 : u1
    })
    setConnections(connProfiles)

    if (user && user.id !== id) {
      const { data: connData } = await supabase
        .from('connections')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${id}),and(user1_id.eq.${id},user2_id.eq.${user.id})`)
        .single()

      if (connData) {
        if (connData.status === 'accepted') setConnectionStatus('accepted')
        else if (connData.user1_id === user.id) setConnectionStatus('sent')
        else setConnectionStatus('pending')
      }
    }

    setLoading(false)
  }

  const handleConnect = async () => {
    if (!user) return
    if (connectionStatus === 'pending') {
      await supabase.from('connections').update({ status: 'accepted' })
        .or(`and(user1_id.eq.${id},user2_id.eq.${user.id})`)
      setConnectionStatus('accepted')
      toast.success('Connection accepted!')
      return
    }
    const { error } = await supabase.from('connections').insert({ user1_id: user.id, user2_id: id, status: 'pending' })
    if (error && error.code !== '23505') { toast.error('Failed'); return }
    setConnectionStatus('sent')
    toast.success('Connection request sent!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8"><ProfileSkeleton /></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-16">
          <div className="text-5xl mb-3">👤</div>
          <h2 className="font-display text-2xl font-bold">User not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} />Back
        </Link>

        {/* Profile header */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden">
          {/* Banner */}
          <div className="h-28 gradient-brand relative">
            {profile.is_premium && (
              <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                <Star size={10} fill="currentColor" />PREMIUM
              </div>
            )}
          </div>

          <div className="px-5 pb-5">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-10 mb-3">
              <div className="relative">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} className="w-20 h-20 rounded-2xl object-cover ring-4 ring-card" alt={profile.username} />
                  : <div className="w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center text-white text-3xl font-bold ring-4 ring-card">
                      {profile.username[0]?.toUpperCase()}
                    </div>
                }
              </div>
              <div className="flex gap-2 pb-1">
                {isSelf ? (
                  <Link href="/dashboard" className="flex items-center gap-1.5 px-4 py-2 bg-secondary rounded-xl text-sm font-semibold hover:bg-accent transition-colors">
                    <Edit size={14} />Edit Profile
                  </Link>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connectionStatus === 'sent' || connectionStatus === 'accepted'}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      connectionStatus === 'accepted' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : connectionStatus === 'sent' ? 'bg-secondary text-muted-foreground'
                      : connectionStatus === 'pending' ? 'gradient-brand text-white'
                      : 'gradient-brand text-white hover:opacity-90 active:scale-95'
                    }`}
                  >
                    {connectionStatus === 'accepted' ? <><UserCheck size={14} />Connected</> : connectionStatus === 'sent' ? 'Pending' : connectionStatus === 'pending' ? 'Accept' : <><UserPlus size={14} />Connect</>}
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl font-bold">@{profile.username}</h1>
                {profile.is_premium && <Star size={14} className="text-amber-400 fill-amber-400" />}
              </div>
              {profile.bio && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{profile.bio}</p>}
              {profile.interests && profile.interests.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {profile.interests.slice(0, 6).map(interest => (
                    <span key={interest} className="text-xs bg-secondary px-2.5 py-1 rounded-full text-muted-foreground">{interest}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="font-display font-bold text-lg">{events.length}</div>
                <div className="text-xs text-muted-foreground">Events</div>
              </div>
              <div className="text-center">
                <div className="font-display font-bold text-lg">{connections.length}</div>
                <div className="text-xs text-muted-foreground">Connected</div>
              </div>
              <div className="text-center">
                <div className="font-display font-bold text-lg flex items-center justify-center gap-0.5">
                  {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                  {avgRating > 0 && <Star size={12} className="text-amber-400 fill-amber-400 mb-0.5" />}
                </div>
                <div className="text-xs text-muted-foreground">{ratingCount > 0 ? `${ratingCount} ratings` : 'No ratings'}</div>
              </div>
              <div className="text-center">
                {isSelf && profile.is_premium ? (
                  <>
                    <div className="font-display font-bold text-lg flex items-center justify-center gap-1">
                      <Eye size={14} className="text-primary" />{profileViews}
                    </div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </>
                ) : isSelf ? (
                  <button onClick={() => setShowPremium(true)} className="text-center">
                    <div className="font-display font-bold text-lg text-muted-foreground">🔒</div>
                    <div className="text-xs text-primary hover:underline">See views</div>
                  </button>
                ) : (
                  <>
                    <div className="font-display font-bold text-lg">—</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </>
                )}
              </div>
            </div>

            {/* Premium upsell for self */}
            {isSelf && !profile.is_premium && (
              <button
                onClick={() => setShowPremium(true)}
                className="w-full mt-4 flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 hover:opacity-90 transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
                    <Star size={14} fill="white" className="text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">Upgrade to Premium</div>
                    <div className="text-xs text-amber-600 dark:text-amber-500">From KES 150/month</div>
                  </div>
                </div>
                <div className="text-amber-600 text-sm font-semibold">→</div>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-2xl p-1">
          {(['events', 'connections'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${activeTab === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {tab === 'events' ? `Events (${events.length})` : `Connected (${connections.length})`}
            </button>
          ))}
        </div>

        {/* Events */}
        {activeTab === 'events' && (
          <div className="space-y-2 animate-fade-in">
            {events.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar size={32} className="mx-auto mb-2 opacity-40" />
                <p>No events attended yet</p>
              </div>
            ) : events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-2xl card-hover">
                  <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{event.title}</div>
                    <div className="text-xs text-muted-foreground">{formatRelativeTime(event.date)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Connections */}
        {activeTab === 'connections' && (
          <div className="space-y-2 animate-fade-in">
            {connections.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users size={32} className="mx-auto mb-2 opacity-40" />
                <p>No connections yet</p>
              </div>
            ) : connections.map(conn => (
              <Link key={conn.id} href={`/profile/${conn.id}`}>
                <div className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-2xl card-hover">
                  {conn.avatar_url
                    ? <img src={conn.avatar_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0">{conn.username[0]?.toUpperCase()}</div>
                  }
                  <div>
                    <div className="font-semibold text-sm">@{conn.username}</div>
                    {conn.bio && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{conn.bio}</div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showPremium && user && (
        <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} userId={user.id} />
      )}
    </div>
  )
}
