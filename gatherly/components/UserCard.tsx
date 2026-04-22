'use client'
import Link from 'next/link'
import { User, UserPlus, UserCheck, Star } from 'lucide-react'
import { Database } from '@/lib/database.types'
import { cn } from '@/lib/utils'

type UserProfile = Database['public']['Tables']['users']['Row']

interface UserCardProps {
  user: UserProfile
  connectionStatus?: 'none' | 'pending' | 'accepted' | 'sent'
  avgRating?: number
  onConnect?: (userId: string) => void
  currentUserId?: string
}

export default function UserCard({ user, connectionStatus = 'none', avgRating, onConnect, currentUserId }: UserCardProps) {
  const isSelf = currentUserId === user.id

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border card-hover group">
      <Link href={`/profile/${user.id}`} className="flex-shrink-0">
        {user.avatar_url
          ? <img src={user.avatar_url} alt={user.username} className="w-11 h-11 rounded-full object-cover ring-2 ring-border group-hover:ring-primary transition-all" />
          : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center ring-2 ring-border">
              <span className="text-white font-bold text-base">{user.username[0]?.toUpperCase()}</span>
            </div>
          )
        }
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Link href={`/profile/${user.id}`} className="font-semibold text-sm hover:text-primary transition-colors truncate">
            {user.username}
          </Link>
          {user.is_premium && (
            <Star size={12} className="text-amber-500 flex-shrink-0" fill="currentColor" />
          )}
        </div>
        {user.bio && <p className="text-xs text-muted-foreground truncate">{user.bio}</p>}
        {avgRating !== undefined && avgRating > 0 && (
          <div className="flex items-center gap-0.5 mt-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={10} className={cn(i < Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground')} />
            ))}
            <span className="text-[10px] text-muted-foreground ml-0.5">{avgRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {!isSelf && onConnect && (
        <button
          onClick={() => onConnect(user.id)}
          disabled={connectionStatus === 'accepted' || connectionStatus === 'pending' || connectionStatus === 'sent'}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
            connectionStatus === 'accepted'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
              : connectionStatus === 'pending' || connectionStatus === 'sent'
              ? 'bg-muted text-muted-foreground'
              : 'gradient-brand text-white hover:opacity-90 active:scale-95'
          )}
        >
          {connectionStatus === 'accepted'
            ? <><UserCheck size={12} /> Connected</>
            : connectionStatus === 'sent'
            ? 'Pending'
            : connectionStatus === 'pending'
            ? 'Respond'
            : <><UserPlus size={12} /> Connect</>
          }
        </button>
      )}
    </div>
  )
}
