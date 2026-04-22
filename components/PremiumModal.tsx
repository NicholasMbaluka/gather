'use client'
import { useState } from 'react'
import { X, Star, Eye, Users, Zap, Check, Phone } from 'lucide-react'
import { formatKES } from '@/lib/utils'
import { getSupabaseClient } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

interface PremiumModalProps {
  open: boolean
  onClose: () => void
  userId: string
}

const PLANS = [
  {
    id: 'premium_monthly',
    label: 'Monthly',
    price: 150,
    period: '/month',
    popular: false,
  },
  {
    id: 'premium_quarterly',
    label: '3 Months',
    price: 400,
    period: '/3 months',
    popular: true,
    savings: 'Save KES 50',
  },
]

const PERKS = [
  { icon: Eye, text: 'See who viewed your profile' },
  { icon: Users, text: 'Unlimited connections' },
  { icon: Star, text: 'Highlighted premium badge' },
  { icon: Zap, text: 'Priority in event attendee list' },
]

export default function PremiumModal({ open, onClose, userId }: PremiumModalProps) {
  const [selected, setSelected] = useState('premium_quarterly')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = getSupabaseClient()

  if (!open) return null

  const handlePayment = async () => {
    if (!phone.match(/^(07|01|\+254)\d{8,9}$/)) {
      toast.error('Enter a valid Safaricom number')
      return
    }
    setLoading(true)
    const plan = PLANS.find(p => p.id === selected)!

    // Create pending payment record
    const { data: payment, error } = await supabase.from('payments').insert({
      user_id: userId,
      amount: plan.price,
      type: selected as 'premium_monthly' | 'premium_quarterly',
      status: 'pending',
      reference: `PAY-${Date.now()}`,
    }).select().single()

    if (error) { toast.error('Failed to initiate payment'); setLoading(false); return }

    // In production: call Supabase Edge Function to trigger M-Pesa STK Push
    // await fetch('/api/mpesa/stkpush', { method: 'POST', body: JSON.stringify({ phone, amount: plan.price, ref: payment.reference }) })

    toast.success(`STK Push sent to ${phone}. Enter your M-Pesa PIN to complete.`, { duration: 6000 })
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl animate-fade-in overflow-hidden">
        {/* Header gradient */}
        <div className="gradient-brand p-6 text-white text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <X size={16} />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Star size={24} fill="white" />
          </div>
          <h2 className="font-display text-2xl font-bold">Gatherly Premium</h2>
          <p className="text-white/80 text-sm mt-1">Unlock the full social experience</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Perks */}
          <div className="grid grid-cols-2 gap-2">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-secondary rounded-xl p-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-primary" />
                </div>
                <span className="text-xs font-medium leading-tight">{text}</span>
              </div>
            ))}
          </div>

          {/* Plans */}
          <div className="grid grid-cols-2 gap-3">
            {PLANS.map(plan => (
              <button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                  selected === plan.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    BEST VALUE
                  </div>
                )}
                <div className="font-semibold text-sm">{plan.label}</div>
                <div className="font-display font-bold text-xl mt-0.5">{formatKES(plan.price)}</div>
                <div className="text-xs text-muted-foreground">{plan.period}</div>
                {plan.savings && <div className="text-xs text-green-600 font-semibold mt-1">{plan.savings}</div>}
                {selected === plan.id && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Phone input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">M-Pesa Phone Number</label>
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
              <Phone size={16} className="text-muted-foreground flex-shrink-0" />
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="0712 345 678"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground">You'll receive an M-Pesa STK push prompt</p>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-3.5 gradient-brand text-white font-bold rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'Processing...' : `Pay ${formatKES(PLANS.find(p => p.id === selected)?.price ?? 0)} via M-Pesa`}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Secured by M-Pesa · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  )
}
