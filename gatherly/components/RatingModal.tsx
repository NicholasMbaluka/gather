'use client'
import { useState } from 'react'
import { Star, X } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { Database } from '@/lib/database.types'
import toast from 'react-hot-toast'

type UserProfile = Database['public']['Tables']['users']['Row']

interface RatingModalProps {
  open: boolean
  onClose: () => void
  fromUserId: string
  toUser: UserProfile
  eventId: string
}

export default function RatingModal({ open, onClose, fromUserId, toUser, eventId }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [loading, setLoading] = useState(false)
  const supabase = getSupabaseClient()

  if (!open) return null

  const handleSubmit = async () => {
    if (!rating) { toast.error('Pick a star rating'); return }
    setLoading(true)
    const { error } = await supabase.from('ratings').upsert({
      from_user: fromUserId,
      to_user: toUser.id,
      event_id: eventId,
      rating,
    }, { onConflict: 'from_user,to_user,event_id' })

    if (error) toast.error('Failed to submit rating')
    else { toast.success('Rating submitted! ⭐'); onClose() }
    setLoading(false)
  }

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Amazing']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-3xl w-full max-w-xs shadow-2xl animate-fade-in p-6">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-secondary transition-colors">
          <X size={16} />
        </button>

        <div className="text-center mb-5">
          {toUser.avatar_url
            ? <img src={toUser.avatar_url} className="w-14 h-14 rounded-full object-cover mx-auto mb-3 ring-2 ring-border" alt="" />
            : <div className="w-14 h-14 rounded-full gradient-brand flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-xl">{toUser.username[0]?.toUpperCase()}</span>
              </div>
          }
          <h3 className="font-display font-bold text-lg">Rate {toUser.username}</h3>
          <p className="text-sm text-muted-foreground">How was your interaction?</p>
        </div>

        <div className="flex justify-center gap-1.5 mb-3">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="p-1 transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                size={32}
                className={`transition-colors ${star <= (hovered || rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}
              />
            </button>
          ))}
        </div>

        {(hovered || rating) > 0 && (
          <p className="text-center text-sm font-semibold text-primary mb-4">{labels[hovered || rating]}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!rating || loading}
          className="w-full py-3 gradient-brand text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {loading ? 'Submitting...' : 'Submit Rating'}
        </button>
      </div>
    </div>
  )
}
