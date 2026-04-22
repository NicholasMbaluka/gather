'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, UserPlus, Calendar, Check, X, Star, Zap, Settings, Upload } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/useAuth'
import { Database } from '@/lib/database.types'
import PremiumModal from '@/components/PremiumModal'
import { formatRelativeTime, INTERESTS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'

type Connection = Database['public']['Tables']['connections']['Row'] & {
  requester?: Database['public']['Tables']['users']['Row']
}

type Event = Database['public']['Tables']['events']['Row']

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [pendingConnections, setPendingConnections] = useState<Connection[]>([])
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [showPremium, setShowPremium] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? [])
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchData()
    setBio(profile?.bio ?? '')
    setInterests(profile?.interests ?? [])
  }, [user, profile])

  const fetchData = async () => {
    if (!user) return
    const [{ data: connections }, { data: events }] = await Promise.all([
      supabase.from('connections').select('*, requester:users!user1_id(*)').eq('user2_id', user.id).eq('status', 'pending'),
      supabase.from('event_attendees').select('events(*)').eq('user_id', user.id).limit(5),
    ])
    setPendingConnections((connections ?? []) as Connection[])
    setMyEvents((events ?? []).map((e: Record<string, unknown>) => e.events as Event).filter(Boolean))
  }

  const handleConnectionResponse = async (connectionId: string, accept: boolean) => {
    const { error } = await supabase.from('connections')
      .update({ status: accept ? 'accepted' : 'rejected' })
      .eq('id', connectionId)
    if (error) { toast.error('Failed to respond'); return }
    toast.success(accept ? 'Connection accepted!' : 'Connection declined')
    setPendingConnections(prev => prev.filter(c => c.id !== connectionId))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    let avatar_url = profile?.avatar_url

    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      avatar_url = publicUrl
    }

    const { error } = await supabase.from('users').update({ bio, interests, avatar_url }).eq('id', user.id)
    if (error) toast.error(error.message)
    else {
      toast.success('Profile updated!')
      await refreshProfile()
      setEditMode(false)
    }
    setSaving(false)
  }

  const toggleInterest = (interest: string) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest])
  }

  if (!user || !profile) return null

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, @{profile.username}</p>
          </div>
          <div className="flex items-center gap-2">
            {!profile.is_premium && (
              <button onClick={() => setShowPremium(true)} className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold rounded-xl hover:opacity-90 transition-all">
                <Star size={14} fill="currentColor" />Upgrade
              </button>
            )}
            <button onClick={() => setEditMode(!editMode)} className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary text-sm font-semibold rounded-xl hover:bg-accent transition-all">
              <Settings size={14} />{editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Edit profile panel */}
        {editMode && (
          <div className="bg-card border border-border rounded-3xl p-5 space-y-5 animate-fade-in">
            <h2 className="font-display font-bold text-lg">Edit Profile</h2>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {(avatarPreview || profile.avatar_url)
                  ? <img src={avatarPreview ?? profile.avatar_url!} className="w-16 h-16 rounded-2xl object-cover" alt="" />
                  : <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-white text-2xl font-bold">{profile.username[0]?.toUpperCase()}</div>
                }
              </div>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-secondary rounded-xl text-sm font-medium cursor-pointer hover:bg-accent transition-colors">
                <Upload size={14} />Change photo
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="sr-only" />
              </label>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                maxLength={160}
                rows={3}
                className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground resize-none"
              />
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Interests</label>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      interests.includes(interest) ? 'gradient-brand text-white' : 'bg-secondary text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-3 gradient-brand text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Connection requests */}
        {pendingConnections.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <UserPlus size={15} className="text-primary" />
              </div>
              <h2 className="font-semibold">Connection Requests</h2>
              <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white">{pendingConnections.length}</div>
            </div>
            <div className="space-y-3">
              {pendingConnections.map(conn => (
                <div key={conn.id} className="flex items-center gap-3 p-3 bg-secondary rounded-2xl">
                  {conn.requester?.avatar_url
                    ? <img src={conn.requester.avatar_url} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
                    : <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-white font-bold flex-shrink-0">{conn.requester?.username?.[0]?.toUpperCase()}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${conn.user1_id}`} className="font-semibold text-sm hover:text-primary transition-colors">
                      @{conn.requester?.username}
                    </Link>
                    <div className="text-xs text-muted-foreground">{formatRelativeTime(conn.created_at)}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleConnectionResponse(conn.id, true)} className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors">
                      <Check size={14} />
                    </button>
                    <button onClick={() => handleConnectionResponse(conn.id, false)} className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Events Joined', value: myEvents.length, icon: Calendar, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
            { label: 'Connections', value: '—', icon: UserPlus, color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
            { label: 'Pending', value: pendingConnections.length, icon: Bell, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon size={16} />
              </div>
              <div className="font-display font-bold text-2xl">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* My upcoming events */}
        <div className="bg-card border border-border rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Calendar size={16} />My Events</h2>
            <Link href="/events" className="text-sm text-primary hover:underline">Browse more</Link>
          </div>
          {myEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={32} className="mx-auto mb-2 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground mb-3">No events joined yet</p>
              <Link href="/events" className="inline-block px-4 py-2 gradient-brand text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all">
                Discover events
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myEvents.map(event => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-2xl hover:bg-accent transition-colors">
                    <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                      <Calendar size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{formatRelativeTime(event.date)}</div>
                    </div>
                    {event.featured && <Zap size={14} className="text-amber-500 flex-shrink-0" />}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Premium card if not premium */}
        {!profile.is_premium && (
          <button onClick={() => setShowPremium(true)} className="w-full p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white text-left hover:opacity-95 transition-all active:scale-[0.99]">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star size={18} fill="white" />
                  <span className="font-display font-bold text-lg">Go Premium</span>
                </div>
                <p className="text-white/80 text-sm">See who viewed your profile, unlimited connections & more</p>
                <div className="mt-3 text-sm font-bold">From KES 150/month →</div>
              </div>
              <div className="text-4xl">⚡</div>
            </div>
          </button>
        )}
      </div>

      {showPremium && <PremiumModal open={showPremium} onClose={() => setShowPremium(false)} userId={user.id} />}
    </div>
  )
}
