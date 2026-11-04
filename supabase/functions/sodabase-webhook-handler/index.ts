import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

/** Accepts Sodabase-style webhook payloads and fans out to defender_alerts. */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const session_id = body.session_id as string | undefined
    if (!session_id) {
      return json({ error: 'session_id required in webhook payload' }, 400)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const title =
      (body.title as string) ??
      (body.issue?.title as string) ??
      'Sodabase anomaly'
    const message =
      (body.message as string) ??
      (body.issue?.summary as string) ??
      'Data quality issue detected.'
    const table_name =
      (body.table as string) ??
      (body.dataset as string) ??
      'unknown'
    const severity =
      (body.severity as string) ?? 'warning'

    const { data: alert, error } = await supabase
      .from('defender_alerts')
      .insert({
        session_id,
        source: 'sodabase',
        severity: ['info', 'warning', 'critical'].includes(severity)
          ? severity
          : 'warning',
        table_name,
        title,
        message,
        metric: body.metric ?? body,
        attack_type: body.attack_type ?? null,
      })
      .select()
      .single()

    if (error) throw error

    return json({ ok: true, alert_id: alert?.id })
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
