'use client'
import { useState } from 'react'
import { Search, LayoutGrid, List, Filter, SlidersHorizontal } from 'lucide-react'
import { useEvents } from '@/hooks/useEvents'
import { useAuth } from '@/hooks/useAuth'
import EventCard from '@/components/EventCard'
import { EventCardSkeleton } from '@/components/Skeleton'
import { EVENT_CATEGORIES } from '@/lib/utils'

export default function EventsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const { user } = useAuth()

  const { events, loading, joinEvent, leaveEvent } = useEvents({
    category,
    search: debouncedSearch,
  })

  const handleSearch = (val: string) => {
    setSearch(val)
    clearTimeout((window as Window & { _st?: ReturnType<typeof setTimeout> })._st)
    ;(window as Window & { _st?: ReturnType<typeof setTimeout> })._st = setTimeout(() => setDebouncedSearch(val), 400)
  }

  const featured = events.filter(e => e.featured)
  const regular = events.filter(e => !e.featured)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Discover Events</h1>
          <p className="text-muted-foreground mt-0.5">Find something amazing happening near you</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView('grid')} className={`p-2.5 rounded-xl transition-all ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}>
            <LayoutGrid size={18} />
          </button>
          <button onClick={() => setView('list')} className={`p-2.5 rounded-xl transition-all ${view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}>
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3 focus-within:border-primary transition-colors shadow-sm">
        <Search size={18} className="text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Search events by name..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {search && (
          <button onClick={() => { setSearch(''); setDebouncedSearch('') }} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => setCategory('all')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${category === 'all' ? 'gradient-brand text-white' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}
        >
          All Events
        </button>
        {EVENT_CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${category === cat.value ? 'gradient-brand text-white' : 'bg-secondary text-muted-foreground hover:bg-accent'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured section */}
      {!loading && featured.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
              <SlidersHorizontal size={13} className="text-amber-600" />
            </div>
            <h2 className="font-display font-bold text-lg">Featured Events</h2>
            <div className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{featured.length}</div>
          </div>
          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {featured.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onJoin={id => user && joinEvent(id, user.id)}
                onLeave={id => user && leaveEvent(id, user.id)}
                userId={user?.id}
                view={view}
              />
            ))}
          </div>
        </section>
      )}

      {/* All events */}
      <section>
        {featured.length > 0 && !loading && (
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-display font-bold text-lg">All Events</h2>
            <div className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{regular.length}</div>
          </div>
        )}

        {loading ? (
          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {[...Array(6)].map((_, i) => <EventCardSkeleton key={i} view={view} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🎪</div>
            <h3 className="font-display text-xl font-bold mb-2">No events found</h3>
            <p className="text-muted-foreground">Try a different category or search term</p>
          </div>
        ) : (
          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {(featured.length > 0 ? regular : events).map(event => (
              <EventCard
                key={event.id}
                event={event}
                onJoin={id => user && joinEvent(id, user.id)}
                onLeave={id => user && leaveEvent(id, user.id)}
                userId={user?.id}
                view={view}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
