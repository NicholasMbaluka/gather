import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return format(new Date(date), 'EEE, MMM d · h:mm a')
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatKES(amount: number) {
  return `KES ${amount.toLocaleString('en-KE')}`
}

export const EVENT_CATEGORIES = [
  { value: 'music', label: '🎵 Music', color: 'bg-purple-500' },
  { value: 'tech', label: '💻 Tech', color: 'bg-blue-500' },
  { value: 'food', label: '🍽️ Food & Drink', color: 'bg-orange-500' },
  { value: 'sports', label: '⚽ Sports', color: 'bg-green-500' },
  { value: 'arts', label: '🎨 Arts', color: 'bg-pink-500' },
  { value: 'business', label: '💼 Business', color: 'bg-gray-500' },
  { value: 'education', label: '📚 Education', color: 'bg-yellow-500' },
  { value: 'social', label: '🎉 Social', color: 'bg-red-500' },
  { value: 'wellness', label: '🧘 Wellness', color: 'bg-teal-500' },
  { value: 'outdoor', label: '🌿 Outdoor', color: 'bg-emerald-500' },
]

export function getCategoryColor(category: string) {
  return EVENT_CATEGORIES.find(c => c.value === category)?.color ?? 'bg-brand-500'
}

export function getCategoryLabel(category: string) {
  return EVENT_CATEGORIES.find(c => c.value === category)?.label ?? category
}

export const INTERESTS = [
  'Music', 'Technology', 'Food', 'Sports', 'Art', 'Business',
  'Travel', 'Photography', 'Gaming', 'Fitness', 'Books', 'Movies',
  'Cooking', 'Dance', 'Fashion', 'Nature', 'Volunteering', 'Networking',
]
