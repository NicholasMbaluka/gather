// supabase/functions/mpesa-stkpush/index.ts
// Deploy with: supabase functions deploy mpesa-stkpush

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { phone, amount, reference, type, eventId } = await req.json()

    // Get M-Pesa access token
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')!
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')!
    const shortcode = Deno.env.get('MPESA_SHORTCODE')!
    const passkey = Deno.env.get('MPESA_PASSKEY')!
    const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL')!

    const auth = btoa(`${consumerKey}:${consumerSecret}`)
    const tokenRes = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` },
    })
    const { access_token } = await tokenRes.json()

    // Format phone: 0712... -> 254712...
    const formattedPhone = phone.replace(/^0/, '254').replace(/^\+/, '')
    
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    // STK Push
    const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${callbackUrl}?ref=${reference}`,
        AccountReference: 'Gatherly',
        TransactionDesc: type === 'featured_event' ? 'Event Boost' : 'Premium Subscription',
      }),
    })

    const stkData = await stkRes.json()

    if (stkData.ResponseCode !== '0') {
      return new Response(JSON.stringify({ error: stkData.CustomerMessage }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    return new Response(JSON.stringify({ success: true, checkoutRequestId: stkData.CheckoutRequestID }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
