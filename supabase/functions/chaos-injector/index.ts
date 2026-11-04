import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

type AttackType =
  | 'null_injection'
  | 'type_mismatch'
  | 'schema_drift'
  | 'negative_stock'

type StoreDataset = 'iphone_shop' | 'shoe_store'

const ATTACK_CONFIG: Record<
  AttackType,
  { healthDelta: number; severity: 'warning' | 'critical' }
> = {
  null_injection: { healthDelta: 28, severity: 'critical' },
  type_mismatch: { healthDelta: 22, severity: 'warning' },
  schema_drift: { healthDelta: 30, severity: 'critical' },
  negative_stock: { healthDelta: 24, severity: 'critical' },
}

function tablesFor(dataset: StoreDataset) {
  if (dataset === 'iphone_shop') {
    return { sales: 'iphone_sales', inventory: 'iphone_inventory', label: 'iPhone Shop' }
  }
  return { sales: 'shoe_sales', inventory: 'shoe_inventory', label: 'Shoe Store' }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { session_id, attack_type } = await req.json()
    if (!session_id || !attack_type) {
      return json({ error: 'session_id and attack_type required' }, 400)
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

    if (sessionErr || !session) {
      return json({ error: 'Session not found' }, 404)
    }
    if (!session.dataset) {
      return json({ error: 'Pick a store dataset before attacking' }, 400)
    }
    if (session.status === 'completed') {
      return json({ error: 'Test run finished' }, 400)
    }

    const dataset = session.dataset as StoreDataset
    const cfg = ATTACK_CONFIG[attack_type as AttackType]
    if (!cfg) {
      return json({ error: 'Invalid attack_type' }, 400)
    }

    const { sales, inventory, label } = tablesFor(dataset)
    let metrics: Record<string, unknown> = {}
    let title = ''
    let message = ''
    let primaryTable = sales

    if (attack_type === 'null_injection') {
      const rows =
        dataset === 'iphone_shop'
          ? Array.from({ length: 100 }, (_, i) => ({
              model: i % 2 === 0 ? 'iPhone 16 Pro' : 'iPhone 15',
              buyer_email: i % 4 === 0 ? null : `ghost-${i}@void.test`,
              quantity: 1,
              unit_price: 999,
            }))
          : Array.from({ length: 100 }, (_, i) => ({
              style: i % 2 === 0 ? 'Air Runner' : 'Trail Max',
              buyer_email: i % 4 === 0 ? null : `ghost-${i}@void.test`,
              size: 10,
              quantity: 1,
              unit_price: 120,
            }))
      const { error } = await supabase.from(sales).insert(rows)
      if (error) throw error

      const { data: pct } = await supabase.rpc('chaos_dataset_null_pct', {
        p_table: `public.${sales}`,
        p_column: 'buyer_email',
      })
      const nullPct = Number(pct ?? 0)
      metrics = {
        store: label,
        player: session.player_name,
        null_ratio_percent: nullPct,
        rows_inserted: rows.length,
        column: 'buyer_email',
        rule: 'buyer_email should be present for every sale',
      }
      title = `[${label}] Null spike on ${sales}.buyer_email`
      message = `Sodabase: ${nullPct}% of rows in ${sales} now have NULL buyer_email (expected ~0%). ${session.player_name ?? 'Player'}'s ${label} data is unsafe for receipts, support lookup, and fraud checks. Severity: CRITICAL.`
      primaryTable = sales
    }

    if (attack_type === 'type_mismatch') {
      const rows =
        dataset === 'iphone_shop'
          ? Array.from({ length: 60 }, (_, i) => ({
              model: 'iPhone 16',
              buyer_email: `bad-type-${i}@test.com`,
              quantity: -1,
              unit_price: i % 2 === 0 ? -199 : 999999,
            }))
          : Array.from({ length: 60 }, (_, i) => ({
              style: 'City Slip',
              buyer_email: `bad-type-${i}@test.com`,
              size: i % 2 === 0 ? -3 : 999,
              quantity: 0,
              unit_price: -50,
            }))
      const { error } = await supabase.from(sales).insert(rows)
      if (error) throw error

      const { count: badPrice } = await supabase
        .from(sales)
        .select('*', { count: 'exact', head: true })
        .lt('unit_price', 0)

      metrics = {
        store: label,
        player: session.player_name,
        invalid_price_rows: badPrice ?? 0,
        column: dataset === 'iphone_shop' ? 'unit_price, quantity' : 'unit_price, size, quantity',
        rule: 'numeric business fields must stay in valid ranges',
      }
      title = `[${label}] Invalid numeric data on ${sales}`
      message = `Sodabase: Found ${badPrice ?? 0}+ rows with negative or impossible prices/sizes in ${session.player_name ?? 'Player'}'s ${label} tables. Looks like string parsing or type coercion failed in the ingestion path.`
      primaryTable = sales
    }

    if (attack_type === 'schema_drift') {
      if (dataset === 'iphone_shop') {
        await supabase
          .from(inventory)
          .update({ model: '' })
          .eq('sku', 'IP16P-256-BLK')
        await supabase.from(inventory).insert({
          model: 'iPhone 16 Pro',
          sku: 'IP16P-256-BLK',
          units_in_stock: 999,
        })
      } else {
        await supabase.from(inventory).update({ style: '' }).eq('sku', 'SH-AIR-10')
        await supabase.from(inventory).insert({
          style: 'Air Runner',
          sku: 'SH-AIR-10',
          units_in_stock: 999,
        })
      }

      metrics = {
        store: label,
        player: session.player_name,
        table: inventory,
        issue: 'duplicate SKU / blank names',
        rule: 'sku must be unique; model/style must not be empty',
      }
      title = `[${label}] Schema drift on ${inventory}`
      message = `Sodabase: Inventory metadata for ${session.player_name ?? 'Player'}'s ${label} no longer matches constraints — duplicate SKUs and empty product names detected (classic bad migration).`
      primaryTable = inventory
    }

    if (attack_type === 'negative_stock') {
      await supabase.from(inventory).update({ units_in_stock: -120 }).gt('units_in_stock', 0)

      const { count: neg } = await supabase
        .from(inventory)
        .select('*', { count: 'exact', head: true })
        .lt('units_in_stock', 0)

      metrics = {
        store: label,
        player: session.player_name,
        negative_skus: neg ?? 0,
        column: 'units_in_stock',
        rule: 'units_in_stock must be >= 0',
      }
      title = `[${label}] Negative inventory on ${inventory}`
      message = `Sodabase: ${neg ?? 0} SKUs in ${inventory} are below zero for ${session.player_name ?? 'Player'}'s ${label}. Oversell risk — warehouse and storefront counts disagree.`
      primaryTable = inventory
    }

    const newHealth = Math.max(0, session.health_score - cfg.healthDelta)
    const sessionPatch: Record<string, unknown> = { health_score: newHealth }
    if (session.status === 'waiting') {
      sessionPatch.status = 'active'
      sessionPatch.started_at = new Date().toISOString()
    }
    await supabase.from('game_sessions').update(sessionPatch).eq('id', session_id)

    await supabase.from('chaos_events').insert({
      session_id,
      attack_type,
      health_delta: -cfg.healthDelta,
      payload_summary: { ...metrics, dataset },
    })

    const slackPreview = `${title}\n${message}\nHealth: ${newHealth}% (was ${session.health_score}%)`

    await supabase.from('defender_alerts').insert({
      session_id,
      source: 'sodabase',
      severity: cfg.severity,
      table_name: primaryTable,
      title,
      message,
      metric: { ...metrics, slack_preview: slackPreview },
      attack_type,
    })

    return json({
      ok: true,
      health_score: newHealth,
      store: label,
      slack_preview: slackPreview,
      sodabase_note:
        'If Slack is connected in Sodabase → Settings → Alerts, the same class of issue will post to your channel when scans detect it.',
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
