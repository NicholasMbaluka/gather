import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }
  
  return createBrowserClient<Database>(url, key)
}

// Singleton for client-side use
let client: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!client) client = createClient()
  return client
}
