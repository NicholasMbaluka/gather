'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) toast.error(error.message)
    else { toast.success('Welcome back!'); router.push('/events') }
    setLoading(false)
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) toast.error(error.message)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex lg:w-1/2 gradient-brand flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${20 + (i * 17) % 60}px`,
                height: `${20 + (i * 17) % 60}px`,
                left: `${(i * 23) % 90}%`,
                top: `${(i * 31) % 90}%`,
                opacity: 0.1 + (i % 5) * 0.05,
              }}
            />
          ))}
        </div>
        <div className="relative">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-2">
            <span className="text-white font-display font-bold text-lg">G</span>
          </div>
          <span className="text-white font-display font-bold text-2xl">Gatherly</span>
        </div>
        <div className="relative space-y-4">
          <h1 className="font-display text-4xl font-bold text-white leading-tight">
            Find your<br />people nearby.
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Discover events, join conversations, and make real connections in your city.
          </p>
          <div className="flex gap-4 pt-2">
            {['Music', 'Tech', 'Food', 'Sports', 'Arts'].map(tag => (
              <div key={tag} className="bg-white/15 backdrop-blur-sm text-white text-sm font-medium px-3 py-1.5 rounded-full border border-white/20">
                {tag}
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-3 text-white/70 text-sm">
          <div className="flex -space-x-2">
            {['🧑🏿', '👩🏾', '🧑🏽', '👨🏻'].map((em, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-sm">{em}</div>
            ))}
          </div>
          <span>Join 10,000+ people already on Gatherly</span>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6 animate-fade-in">
          <div className="lg:hidden flex items-center gap-2 mb-2">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">G</span>
            </div>
            <span className="font-display font-bold text-xl text-gradient">Gatherly</span>
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 border-border hover:border-primary/50 hover:bg-accent transition-all font-medium text-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Email</label>
              <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3">
                <Mail size={16} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Password</label>
              <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3">
                <Lock size={16} className="text-muted-foreground flex-shrink-0" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 gradient-brand text-white font-bold rounded-2xl hover:opacity-90 transition-all disabled:opacity-60 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? 'Signing in...' : <><span>Sign in</span><ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
