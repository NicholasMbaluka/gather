// supabase/functions/mpesa-callback/index.ts
// Deploy with: supabase functions deploy mpesa-callback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const reference = url.searchParams.get('ref')
    const body = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const resultCode = body?.Body?.stkCallback?.ResultCode
    
    if (resultCode === 0 && reference) {
      // Payment successful - trigger complete_payment function
      await supabase.rpc('complete_payment', { payment_ref: reference })
    } else if (reference) {
      // Payment failed
      await supabase.from('payments').update({ status: 'failed' }).eq('reference', reference)
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: 'Success' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Callback error:', err)
    return new Response('OK', { status: 200 })
  }
})
