import {
  Database,
  Footprints,
  MessageSquare,
  ShieldAlert,
  Smartphone,
} from 'lucide-react'
import { useState } from 'react'
import { ProductCard } from './components/ProductCard'
import { useStoreProducts } from './hooks/useStoreProducts'
import { resetStore, testVulnerabilities } from './lib/gameApi'
import { STORES } from './lib/stores'
import { supabase } from './lib/supabase'
import type { StoreDataset } from './lib/types'

type Step = 'pick' | 'catalog'

function App() {
  const [step, setStep] = useState<Step>('pick')
  const [playerName, setPlayerName] = useState('')
  const [dataset, setDataset] = useState<StoreDataset | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tested, setTested] = useState(false)
  const [showSlackPrompt, setShowSlackPrompt] = useState(false)
  const [slackSummary, setSlackSummary] = useState<string | null>(null)

  const storeMeta = dataset ? STORES.find((s) => s.id === dataset) : null
  const { products, loading, refresh } = useStoreProducts(dataset)

  const openCatalog = async () => {
    if (!playerName.trim() || !dataset) return
    setBusy(true)
    setError(null)
    try {
      await resetStore(dataset)
      const { data, error: err } = await supabase
        .from('game_sessions')
        .insert({
          status: 'waiting',
          player_name: playerName.trim(),
          dataset,
          health_score: 100,
        })
        .select()
        .single()
      if (err || !data) throw new Error(err?.message ?? 'Session failed')
      setSessionId(data.id)
      setTested(false)
      setShowSlackPrompt(false)
      setSlackSummary(null)
      await refresh()
      setStep('catalog')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open store')
    } finally {
      setBusy(false)
    }
  }

  const runVulnerabilityTest = async () => {
    if (!sessionId || tested) return
    setBusy(true)
    setError(null)
    try {
      const result = await testVulnerabilities(sessionId)
      setTested(true)
      setShowSlackPrompt(true)
      setSlackSummary(result.slack_summary)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test failed')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'pick') {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-8 px-6 py-10">
        <header className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-300">
            <Database className="size-7" />
          </div>
          <h1 className="text-3xl font-semibold">ChaosMonkey</h1>
          <p className="mt-2 text-slate-400">Your products live in Supabase · Sodabase alerts Slack</p>
        </header>

        <div>
          <label className="text-sm text-slate-400" htmlFor="name">
            Your name
          </label>
          <input
            id="name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-500"
            placeholder="Alex"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {STORES.map((store) => (
            <button
              key={store.id}
              type="button"
              onClick={() => setDataset(store.id)}
              className={`rounded-2xl border p-4 text-left ${
                dataset === store.id
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              {store.id === 'iphone_shop' ? (
                <Smartphone className="mb-2 size-6 text-violet-300" />
              ) : (
                <Footprints className="mb-2 size-6 text-emerald-300" />
              )}
              <p className="font-medium">{store.name}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy || !playerName.trim() || !dataset}
          onClick={() => void openCatalog()}
          className="rounded-xl bg-violet-600 py-3 font-medium hover:bg-violet-500 disabled:opacity-40"
        >
          View my catalog
        </button>

        {error && <p className="text-sm text-rose-300">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Your store</p>
          <h1 className="text-2xl font-semibold">{storeMeta?.name}</h1>
          <p className="text-sm text-slate-400">{playerName}&apos;s catalog · live from Supabase</p>
        </div>
        {!tested && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void runVulnerabilityTest()}
            className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            Test the data for vulnerabilities
          </button>
        )}
      </header>

      {error && (
        <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      )}

      {showSlackPrompt && (
        <div className="mb-8 rounded-2xl border border-sky-500/40 bg-sky-500/10 p-5">
          <p className="flex items-center gap-2 font-semibold text-sky-100">
            <MessageSquare className="size-5" /> Check Slack for Sodabase
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">
            Your catalog updated in real time below. Sodabase is (or will be) posting what
            broke — open the Slack channel you connected in{' '}
            <a
              href="https://sodabase.io/settings/alerts"
              target="_blank"
              rel="noreferrer"
              className="text-violet-300 underline"
            >
              Sodabase → Alerts
            </a>
            .
          </p>
          {slackSummary && (
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-950/60 p-3 text-xs text-slate-400">
              {slackSummary}
            </pre>
          )}
        </div>
      )}

      {tested && !showSlackPrompt && (
        <p className="mb-4 flex items-center gap-2 text-sm text-slate-400">
          <ShieldAlert className="size-4 text-rose-400" /> Vulnerability test applied — scroll to see damaged products
        </p>
      )}

      {loading ? (
        <p className="text-slate-500">Loading products…</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} tested={tested} />
          ))}
        </div>
      )}

      {tested && (
        <p className="mt-8 text-center text-xs text-slate-500">
          Product order follows <code className="text-slate-400">display_order</code> from
          the database — injections resort and corrupt rows live.
        </p>
      )}
    </div>
  )
}

export default App
