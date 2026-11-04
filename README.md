# ChaosMonkey

Demo: **your product catalog** (iPhone Shop or Shoe Store) lives in Supabase. One button runs a **scripted vulnerability test**; the UI updates in **real time**; **Sodabase** tells you on **Slack** what broke.

## Flow

1. Enter your name and pick **iPhone Shop** or **Shoe Store**.
2. **View my catalog** — 20 products with local SVG images, prices, and stock (resets to a clean baseline).
3. Click **Test the data for vulnerabilities** once — backend applies a **fixed** corruption script.
4. Watch products reorder and degrade live (missing names, bad prices, oversold stock).
5. Banner prompts: **Check Slack for Sodabase**.

## Slack & Sodabase (important)

Connect once: [Sodabase → Settings → Alerts](https://sodabase.io/settings/alerts) → **Add to Slack**.

The vulnerability button updates **`iphone_inventory` / `iphone_sales`** or **`shoe_inventory` / `shoe_sales`**. It does **not** touch `public.orders`.

If Sodabase is only watching **`orders`** (from an earlier demo), Slack will keep showing the **same** “invalid values on orders” message and **the same timestamp** — that issue stays open until you resolve it or the watched table changes.

**For this hackathon demo:**

1. Open your [Sodabase project](https://sodabase.io/projects/pjkbsiyvczxznzachaet).
2. **Watch** (enable monitoring for) the store you demo: `iphone_inventory`, `iphone_sales`, and/or `shoe_inventory`, `shoe_sales`.
3. Optionally **mute or resolve** the old `orders` issue so it does not distract judges.
4. Run **View my catalog** (clean reset) → **Test the data for vulnerabilities** → wait ~1–2 minutes → check Slack for a **new** alert on the store tables.

The app banner lists exactly what the test script changed; Sodabase Slack text comes from its scan of **watched** tables only.

## Run

```bash
npm install && npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see `.env.example`).

## Deploy on Render

Backend stays on **Supabase** (database + `test-vulnerabilities` edge function). Render only hosts the **Vite static frontend**.

### 1. Push this repo to GitHub

Render deploys from `Connor-P-Melton/ny_hackathon` on branch `main`. Include `public/products/` so images work in production.

### 2. Create the site (Blueprint — easiest)

1. Sign in at [render.com](https://render.com) and connect your GitHub account.
2. **New** → **Blueprint**.
3. Select repo **`Connor-P-Melton/ny_hackathon`**.
4. Render reads [`render.yaml`](render.yaml) and proposes a static site named **chaosmonkey**.
5. When prompted, set **Environment Variables** (required at **build** time for Vite):

   | Key | Value |
   |-----|--------|
   | `VITE_SUPABASE_URL` | `https://pjkbsiyvczxznzachaet.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase **anon** key (Dashboard → Project Settings → API, or copy from local `.env`) |

6. **Apply** and wait for the first deploy (usually 2–4 minutes).

Your live URL will look like `https://chaosmonkey.onrender.com` (or similar).

### 3. Manual static site (alternative)

**New** → **Static Site** → same repo → **Build command** `npm install && npm run build` → **Publish directory** `dist` → add the two `VITE_*` env vars → **Create Static Site**.

### 4. After deploy

- Open the Render URL → pick a store → **View my catalog** → **Test the data for vulnerabilities**.
- If the page is blank, check the deploy **Logs** for “Missing VITE_SUPABASE_URL” — env vars were not set before build. Set them and **Manual Deploy** → **Clear build cache & deploy**.

### 5. Redeploys

Every push to `main` triggers a new deploy if auto-deploy is on (default).
