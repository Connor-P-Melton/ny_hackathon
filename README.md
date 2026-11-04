# ChaosMonkey

Demo: **your product catalog** (iPhone Shop or Shoe Store) lives in Supabase. One button runs a **scripted vulnerability test**; the UI updates in **real time**; **Sodabase** tells you on **Slack** what broke.

## Flow

1. Enter your name and pick **iPhone Shop** or **Shoe Store**.
2. **View my catalog** — 3 products with images, prices, and stock (reset to a clean baseline).
3. Click **Test the data for vulnerabilities** once — backend applies a **fixed** corruption script.
4. Watch products reorder and degrade live (missing names, bad prices, oversold stock).
5. Banner prompts: **Check Slack for Sodabase**.

## Slack

Connect once: [Sodabase → Settings → Alerts](https://sodabase.io/settings/alerts) → **Add to Slack**.

## Run

```bash
npm install && npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`).
