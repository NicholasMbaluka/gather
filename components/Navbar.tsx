'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { Bell, Compass, Plus, User, LogOut, Star, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  const navLinks = [
    { href: '/events', label: 'Discover', icon: Compass },
    { href: '/events/create', label: 'Create', icon: Plus },
    { href: '/dashboard', label: 'Dashboard', icon: Bell },
  ]

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (!user) return null

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/events" className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">G</span>
            </div>
            <span className="font-display font-bold text-xl text-gradient hidden sm:block">Gatherly</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  pathname === href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {profile?.is_premium && (
              <div className="hidden sm:flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full">
                <Star size={11} fill="currentColor" />
                Premium
              </div>
            )}

            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.username} className="w-8 h-8 rounded-full object-cover ring-2 ring-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User size={14} className="text-primary-foreground" />
                </div>
              )}
              <span className="hidden md:block text-sm font-medium truncate max-w-[100px]">
                {profile?.username ?? 'Profile'}
              </span>
            </Link>

            <button
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
            >
              <LogOut size={15} />
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-accent transition-colors"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-border space-y-1 animate-fade-in">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  pathname === href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-destructive w-full hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
