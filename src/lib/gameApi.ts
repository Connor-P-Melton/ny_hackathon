import { functionsUrl, supabase } from './supabase'
import type { StoreDataset } from './types'

async function callFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<T> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const res = await fetch(`${functionsUrl}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? `Function ${name} failed (${res.status})`)
  }
  return data
}

export async function resetStore(dataset: StoreDataset) {
  const rpc =
    dataset === 'iphone_shop' ? 'chaos_reset_iphone_shop' : 'chaos_reset_shoe_store'
  const { error } = await supabase.rpc(rpc)
  if (error) {
    throw new Error(error.message)
  }
}

export function testVulnerabilities(sessionId: string) {
  return callFunction<{
    ok: boolean
    health_score: number
    effects: string[]
    slack_prompt: string
    slack_summary: string
  }>('test-vulnerabilities', { session_id: sessionId })
}
