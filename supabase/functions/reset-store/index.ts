import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { dataset } = await req.json()
    if (dataset !== 'iphone_shop' && dataset !== 'shoe_store') {
      return json({ error: 'dataset must be iphone_shop or shoe_store' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const rpc = dataset === 'iphone_shop' ? 'chaos_reset_iphone_shop' : 'chaos_reset_shoe_store'
    const { error } = await supabase.rpc(rpc)
    if (error) {
      return json({ error: error.message, details: error.details }, 500)
    }

    return json({ ok: true })
  } catch (e) {
    console.error(e)
    const msg = e instanceof Error ? e.message : String(e)
    return json({ error: msg }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
