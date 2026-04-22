'use client'
import Link from 'next/link'
import { Calendar, MapPin, Users, Zap, Star } from 'lucide-react'
import { formatDate, getCategoryLabel, cn } from '@/lib/utils'
import { Database } from '@/lib/database.types'

type Event = Database['public']['Tables']['events']['Row'] & {
  attendee_count?: number
  creator?: Database['public']['Tables']['users']['Row']
  is_attending?: boolean
}

interface EventCardProps {
  event: Event
  onJoin?: (id: string) => void
  onLeave?: (id: string) => void
  userId?: string
  view?: 'grid' | 'list'
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  music: 'from-purple-500 to-indigo-600',
  tech: 'from-blue-500 to-cyan-600',
  food: 'from-orange-500 to-amber-600',
  sports: 'from-green-500 to-emerald-600',
  arts: 'from-pink-500 to-rose-600',
  business: 'from-slate-500 to-gray-600',
  education: 'from-yellow-500 to-amber-500',
  social: 'from-red-500 to-rose-500',
  wellness: 'from-teal-500 to-cyan-500',
  outdoor: 'from-emerald-500 to-green-600',
}

export default function EventCard({ event, onJoin, onLeave, userId, view = 'grid' }: EventCardProps) {
  const gradient = CATEGORY_GRADIENTS[event.category] ?? 'from-brand-500 to-orange-600'
  const isFull = event.max_attendees ? (event.attendee_count ?? 0) >= event.max_attendees : false

  if (view === 'list') {
    return (
      <Link href={`/events/${event.id}`} className="block">
        <div className={cn(
          'flex gap-4 p-4 rounded-2xl bg-card border border-border card-hover group',
          event.featured && 'ring-1 ring-amber-400/50'
        )}>
          {/* Image / Color Block */}
          <div className={cn('w-20 h-20 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center', gradient)}>
            {event.image_url
              ? <img src={event.image_url} className="w-full h-full object-cover rounded-xl" alt="" />
              : <span className="text-2xl">{getCategoryEmoji(event.category)}</span>
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                {event.featured && (
                  <div className="inline-flex items-center gap-1 text-amber-600 text-xs font-semibold mb-1">
                    <Zap size={10} fill="currentColor" />
                    Featured
                  </div>
                )}
                <h3 className="font-display font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                  {event.title}
                </h3>
              </div>
              {event.is_attending && (
                <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Going</span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(event.date)}</span>
              <span className="flex items-center gap-1"><MapPin size={11} />{event.location}</span>
              <span className="flex items-center gap-1"><Users size={11} />{event.attendee_count ?? 0} going</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <div className={cn(
      'rounded-2xl bg-card border border-border overflow-hidden card-hover group flex flex-col',
      event.featured && 'ring-1 ring-amber-400/60'
    )}>
      {/* Header image */}
      <div className={cn('h-40 bg-gradient-to-br relative overflow-hidden', gradient)}>
        {event.image_url && (
          <img src={event.image_url} className="absolute inset-0 w-full h-full object-cover" alt="" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          {event.featured && (
            <div className="flex items-center gap-1 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              <Zap size={10} fill="currentColor" />
              Featured
            </div>
          )}
          <div className="bg-black/30 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {getCategoryLabel(event.category)}
          </div>
        </div>
        {event.is_attending && (
          <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            ✓ Going
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 text-white text-xs font-medium bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
          <Users size={11} />
          {event.attendee_count ?? 0}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/events/${event.id}`}>
          <h3 className="font-display font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors mb-2">
            {event.title}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{event.description}</p>

        <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5"><Calendar size={12} className="text-primary" />{formatDate(event.date)}</div>
          <div className="flex items-center gap-1.5"><MapPin size={12} className="text-primary" />{event.location}</div>
        </div>

        {/* Creator */}
        {event.creator && (
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
            {event.creator.avatar_url
              ? <img src={event.creator.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
              : <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">{event.creator.username[0]?.toUpperCase()}</div>
            }
            <span className="text-xs text-muted-foreground">by <span className="font-medium text-foreground">{event.creator.username}</span></span>
          </div>
        )}

        {/* Action button */}
        {userId && (
          <button
            onClick={(e) => {
              e.preventDefault()
              if (event.is_attending) onLeave?.(event.id)
              else onJoin?.(event.id)
            }}
            disabled={isFull && !event.is_attending}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-semibold transition-all',
              event.is_attending
                ? 'bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                : isFull
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'gradient-brand text-white hover:opacity-90 active:scale-[0.98]'
            )}
          >
            {event.is_attending ? 'Leave Event' : isFull ? 'Event Full' : 'Join Event →'}
          </button>
        )}
      </div>
    </div>
  )
}

function getCategoryEmoji(category: string) {
  const map: Record<string, string> = {
    music: '🎵', tech: '💻', food: '🍽️', sports: '⚽',
    arts: '🎨', business: '💼', education: '📚', social: '🎉',
    wellness: '🧘', outdoor: '🌿',
  }
  return map[category] ?? '📌'
}
