'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, AlignLeft, Tag, Users, Image as ImageIcon, ArrowLeft } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { useAuth } from '@/hooks/useAuth'
import { EVENT_CATEGORIES } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function CreateEventPage() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    date: '',
    category: 'social',
    max_attendees: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toast.error('Sign in required'); return }
    setLoading(true)

    let image_url: string | null = null

    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `events/${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('event-images').upload(path, imageFile)
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(path)
        image_url = publicUrl
      }
    }

    const { data, error } = await supabase.from('events').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      date: form.date,
      category: form.category,
      created_by: user.id,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
      image_url,
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Auto-join as creator
    await supabase.from('event_attendees').insert({ event_id: data.id, user_id: user.id })

    toast.success('Event created! 🎉')
    router.push(`/events/${data.id}`)
    setLoading(false)
  }

  const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} />Back to events
      </Link>

      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        {/* Preview banner */}
        <div className="relative h-40 bg-gradient-to-br from-primary to-orange-600 overflow-hidden">
          {imagePreview && <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover" alt="" />}
          <div className="absolute inset-0 flex items-center justify-center">
            <label className="flex flex-col items-center gap-2 cursor-pointer text-white/80 hover:text-white transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ImageIcon size={20} />
              </div>
              <span className="text-sm font-medium">{imagePreview ? 'Change photo' : 'Add cover photo'}</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
            </label>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <h1 className="font-display text-2xl font-bold mb-0.5">Create an Event</h1>
            <p className="text-sm text-muted-foreground">Bring people together around something you love</p>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Event Title <span className="text-destructive">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Nairobi Tech Meetup #12"
              required
              maxLength={100}
              className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold flex items-center gap-1.5"><AlignLeft size={14} />Description <span className="text-destructive">*</span></label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What's this event about? Who should come?"
              required
              rows={4}
              className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground resize-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-1.5"><Calendar size={14} />Date & Time <span className="text-destructive">*</span></label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={e => set('date', e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-1.5"><MapPin size={14} />Location <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="e.g. iHub, Nairobi"
                required
                className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-1.5"><Tag size={14} />Category <span className="text-destructive">*</span></label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none"
              >
                {EVENT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Max attendees */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-1.5"><Users size={14} />Max Attendees <span className="text-muted-foreground font-normal">(opt)</span></label>
              <input
                type="number"
                value={form.max_attendees}
                onChange={e => set('max_attendees', e.target.value)}
                placeholder="Unlimited"
                min="1"
                max="10000"
                className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 gradient-brand text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all active:scale-[0.98] text-base"
          >
            {loading ? 'Creating event...' : 'Create Event 🎉'}
          </button>
        </form>
      </div>
    </div>
  )
}
