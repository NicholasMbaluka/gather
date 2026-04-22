'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { INTERESTS } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) { toast.error(error.message); setLoading(false); return }
    setUserId(data.user?.id ?? null)
    setLoading(false)
    setStep(2)
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?onboard=true` },
    })
    if (error) toast.error(error.message)
  }

  const handleProfileCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) { toast.error('Username required'); return }
    setLoading(true)

    const uid = userId ?? (await supabase.auth.getUser()).data.user?.id
    if (!uid) { toast.error('Session expired, please sign up again'); setLoading(false); return }

    const { error } = await supabase.from('users').upsert({
      id: uid,
      username: username.trim().toLowerCase().replace(/\s+/g, '_'),
      bio: bio.trim(),
      interests: selectedInterests,
    })

    if (error) {
      if (error.code === '23505') toast.error('Username taken!')
      else toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Profile created! Welcome to Gatherly 🎉')
    router.push('/events')
    setLoading(false)
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 gradient-brand rounded-xl flex items-center justify-center">
            <span className="text-white font-display font-bold">G</span>
          </div>
          <span className="font-display font-bold text-2xl text-gradient">Gatherly</span>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'gradient-brand' : 'bg-border'}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h2 className="font-display text-3xl font-bold">Create account</h2>
              <p className="text-muted-foreground mt-1">Join thousands of people discovering events</p>
            </div>

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

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Email</label>
                <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3">
                  <Mail size={16} className="text-muted-foreground" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Password</label>
                <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3">
                  <Lock size={16} className="text-muted-foreground" />
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required minLength={8} className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 gradient-brand text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {loading ? 'Creating account...' : <><span>Continue</span><ArrowRight size={16} /></>}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-6">
            <div>
              <h2 className="font-display text-3xl font-bold">Your profile</h2>
              <p className="text-muted-foreground mt-1">Tell people a bit about yourself</p>
            </div>

            <form onSubmit={handleProfileCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Username <span className="text-destructive">*</span></label>
                <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3">
                  <User size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="coolhandle"
                    required
                    maxLength={30}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Bio <span className="text-muted-foreground font-normal">(optional)</span></label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  maxLength={160}
                  rows={3}
                  className="w-full bg-secondary rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-muted-foreground resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{bio.length}/160</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Interests <span className="text-muted-foreground font-normal">(pick a few)</span></label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                        selectedInterests.includes(interest)
                          ? 'gradient-brand text-white'
                          : 'bg-secondary text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3.5 gradient-brand text-white font-bold rounded-2xl hover:opacity-90 disabled:opacity-60 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                {loading ? 'Creating profile...' : <><span>Go to Gatherly</span><ArrowRight size={16} /></>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
