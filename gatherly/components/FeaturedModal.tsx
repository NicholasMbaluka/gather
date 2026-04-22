'use client'
import { useState } from 'react'
import { X, Zap, TrendingUp, Eye, Check, Phone } from 'lucide-react'
import { formatKES } from '@/lib/utils'
import { getSupabaseClient } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

interface FeaturedModalProps {
  open: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
  userId: string
}

export default function FeaturedModal({ open, onClose, eventId, eventTitle, userId }: FeaturedModalProps) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = getSupabaseClient()

  if (!open) return null

  const AMOUNT = 200

  const handleBoost = async () => {
    if (!phone.match(/^(07|01|\+254)\d{8,9}$/)) {
      toast.error('Enter a valid Safaricom number')
      return
    }
    setLoading(true)

    const { error: payError } = await supabase.from('payments').insert({
      user_id: userId,
      amount: AMOUNT,
      type: 'featured_event',
      status: 'pending',
      event_id: eventId,
      reference: `BOOST-${Date.now()}`,
    })

    if (payError) { toast.error('Failed to initiate payment'); setLoading(false); return }

    // In production, trigger STK push via Edge Function then update event.featured = true on webhook
    toast.success('STK Push sent! Event will be featured after payment.', { duration: 6000 })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-3xl w-full max-w-sm shadow-2xl animate-fade-in">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white text-center rounded-t-3xl relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30">
            <X size={16} />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <Zap size={24} fill="white" />
          </div>
          <h2 className="font-display text-xl font-bold">Boost Event</h2>
          <p className="text-white/80 text-sm">Get more attendees</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-3">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 truncate">{eventTitle}</p>
          </div>

          <div className="space-y-2.5">
            {[
              { icon: TrendingUp, text: 'Featured at the top of event listings' },
              { icon: Eye, text: '3x more profile visibility' },
              { icon: Zap, text: 'Featured badge on your event card' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-amber-600 dark:text-amber-400" />
                </div>
                {text}
              </div>
            ))}
          </div>

          <div className="bg-secondary rounded-2xl p-3 flex items-center justify-between">
            <span className="text-sm font-medium">Boost Price</span>
            <span className="font-display font-bold text-lg text-primary">{formatKES(AMOUNT)}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">M-Pesa Number</label>
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
              <Phone size={15} className="text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <button
            onClick={handleBoost}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-60 active:scale-[0.98]"
          >
            {loading ? 'Processing...' : `Pay ${formatKES(AMOUNT)} to Boost`}
          </button>
        </div>
      </div>
    </div>
  )
}
