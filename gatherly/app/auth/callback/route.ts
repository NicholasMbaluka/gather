import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const onboard = searchParams.get('onboard')

  if (code) {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (user) {
      // Check if profile exists
      const { data: profile } = await supabase.from('users').select('id').eq('id', user.id).single()
      if (!profile || onboard) {
        return NextResponse.redirect(`${origin}/signup?step=2`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/events`)
}
