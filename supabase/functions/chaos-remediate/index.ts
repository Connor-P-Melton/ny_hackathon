import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

type RemediationType =
  | 'quarantine_nulls'
  | 'fix_type_errors'
  | 'rollback_schema'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id, remediation_type, alert_id } = await req.json()
    if (!session_id || !remediation_type) {
      return json({ error: 'session_id and remediation_type required' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: session } = await supabase
      .from('game_sessions')
      .select('health_score, status')
      .eq('id', session_id)
      .single()

    if (!session || session.status === 'completed') {
      return json({ error: 'Invalid session' }, 400)
    }

    let restored = 15

    if (remediation_type === 'quarantine_nulls') {
      await supabase.from('orders').delete().is('customer_email', null)
    } else if (remediation_type === 'fix_type_errors') {
      await supabase.from('orders').delete().lt('total_price', 0)
      await supabase.from('orders').delete().gt('total_price', 10000)
    } else if (remediation_type === 'rollback_schema') {
      await supabase
        .from('target_tables')
        .update({ health_status: 'healthy', is_nullable: false })
        .eq('table_name', 'user_profiles')
      await supabase
        .from('user_profiles')
        .delete()
        .or('display_name.is.null,display_name.eq.')
    } else {
      return json({ error: 'Unknown remediation_type' }, 400)
    }

    const newHealth = Math.min(100, session.health_score + restored)

    await supabase
      .from('game_sessions')
      .update({ health_score: newHealth })
      .eq('id', session_id)

    let alertQuery = supabase
      .from('defender_alerts')
      .update({ resolved: true })
      .eq('session_id', session_id)
      .eq('resolved', false)

    if (alert_id) {
      alertQuery = alertQuery.eq('id', alert_id)
    }

    await alertQuery

    await supabase.from('defender_alerts').insert({
      session_id,
      source: 'sodabase',
      severity: 'info',
      table_name: 'system',
      title: 'Remediation applied',
      message: `Fix "${remediation_type}" completed. Sodabase re-check pending — health restored +${restored} points.`,
      metric: { remediation_type, restored_points: restored },
      attack_type: null,
      resolved: true,
    })

    return json({ ok: true, health_score: newHealth, restored })
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
