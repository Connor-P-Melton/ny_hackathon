import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

/** Hardcoded vulnerability script — same outcome every run per store. */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id } = await req.json()
    if (!session_id) {
      return json({ error: 'session_id required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: session, error: sessionErr } = await supabase
      .from('game_sessions')
      .select('id, health_score, status, dataset, player_name')
      .eq('id', session_id)
      .single()

    if (sessionErr || !session?.dataset) {
      return json({ error: 'Session or dataset not found' }, 404)
    }

    const player = session.player_name ?? 'Store owner'
    let slackSummary = ''
    let effects: string[] = []

    if (session.dataset === 'iphone_shop') {
      await supabase.from('iphone_inventory').update({ model: '' }).eq('sku', 'IP16P-256-BLK')
      await supabase.from('iphone_inventory').update({ units_in_stock: -24, display_order: 99 }).eq('sku', 'IP16P-256-BLK')
      await supabase.from('iphone_inventory').update({ display_order: 0, list_price: -1 }).eq('sku', 'IP16-128-WHT')
      await supabase.from('iphone_inventory').update({ units_in_stock: 0, model: '??? unknown SKU' }).eq('sku', 'IP15-128-BLU')
      await supabase.from('iphone_sales').update({ buyer_email: null }).like('buyer_email', 'buyer%')

      effects = [
        'iPhone 16 Pro lost its product name on the shelf',
        'iPhone 16 Pro stock went negative (−24) and sorted last',
        'iPhone 16 price corrupted (−$1) and jumped to top of list',
        'iPhone 15 renamed to garbage text with zero stock',
        'Recent orders lost buyer emails',
      ]
      slackSummary =
        `Sodabase · ${player}'s iPhone Shop\n` +
        `CRITICAL: iphone_sales buyer_email null spike; iphone_inventory has blank names, negative stock, and invalid prices.\n` +
        `Tables: iphone_inventory, iphone_sales · Check Slack for full Sodabase thread.`
    } else {
      await supabase.from('shoe_inventory').update({ style: '' }).eq('sku', 'SH-AIR-10')
      await supabase.from('shoe_inventory').update({ units_in_stock: -50, display_order: 99 }).eq('sku', 'SH-AIR-10')
      await supabase.from('shoe_inventory').update({ display_order: 0, list_price: 99999 }).eq('sku', 'SH-TRAIL-9')
      await supabase.from('shoe_inventory').update({ style: 'DISCONTINUED???', units_in_stock: 0 }).eq('sku', 'SH-CITY-8')
      await supabase.from('shoe_sales').update({ buyer_email: null }).like('buyer_email', 'buyer%')

      effects = [
        'Air Runner lost its style name',
        'Air Runner oversold (−50 pairs) and pushed to bottom',
        'Trail Max price exploded to $99,999 and sorted first',
        'City Slip marked discontinued with zero stock',
        'Recent orders lost buyer emails',
      ]
      slackSummary =
        `Sodabase · ${player}'s Shoe Store\n` +
        `CRITICAL: shoe_sales buyer_email null spike; shoe_inventory has blank styles, negative stock, and absurd prices.\n` +
        `Tables: shoe_inventory, shoe_sales · Check Slack for full Sodabase thread.`
    }

    const newHealth = 34
    await supabase
      .from('game_sessions')
      .update({ health_score: newHealth, status: 'active', started_at: new Date().toISOString() })
      .eq('id', session_id)

    await supabase.from('chaos_events').insert({
      session_id,
      attack_type: 'null_injection',
      health_delta: newHealth - session.health_score,
      payload_summary: { effects, scripted: true },
    })

    await supabase.from('defender_alerts').insert({
      session_id,
      source: 'sodabase',
      severity: 'critical',
      table_name: session.dataset === 'iphone_shop' ? 'iphone_inventory' : 'shoe_inventory',
      title: 'Vulnerability test completed',
      message: slackSummary,
      metric: { effects },
      attack_type: 'null_injection',
    })

    return json({
      ok: true,
      health_score: newHealth,
      effects,
      slack_prompt: 'Open Slack — Sodabase should be posting what happened to your tables.',
      slack_summary: slackSummary,
    })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? e.message : 'Unknown error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
