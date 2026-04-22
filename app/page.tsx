import { redirect } from 'next/navigation'
import { isSupabaseConfigured } from '@/lib/supabase-server'
import SetupPage from '@/components/SetupPage'

// Gatherly - Event Management App
export default function Home() {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    return <SetupPage />
  }
  
  redirect('/events')
}
