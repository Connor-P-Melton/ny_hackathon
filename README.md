# ny_hackathon

## MCP setup (Cursor agent)

This repo includes [`.cursor/mcp.json`](.cursor/mcp.json) so the agent can use **Supabase** and **Sodabase** during the hackathon.

| Server | URL | What the agent can do |
|--------|-----|------------------------|
| **Supabase** | `https://mcp.supabase.com/mcp` | SQL, migrations, edge functions, docs search, advisors |
| **Sodabase** | `https://sodabase.io/mcp` | Connect project, monitors, data-trust scans, inbox issues |

**One-time steps in Cursor**

1. **Reload MCP** — Settings → Tools & MCP (or restart Cursor) so both servers appear.
2. **Authenticate Supabase** — open MCP for `supabase` and complete OAuth.
3. **Authenticate Sodabase** — same for `sodabase` (browser sign-in with Supabase-linked account).
4. **Link your hackathon project** — ask the agent to run Sodabase `connect_project` and pick your Supabase project ref.

Optional: scope Supabase to one project by changing the URL to  
`https://mcp.supabase.com/mcp?project_ref=YOUR_REF&features=database,docs,edge_functions`.

**Hosting (Render)** — static Vite build for the React UI; Supabase hosts DB, Realtime, and Edge Functions. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on Render.

---

# Project Directive: Build "ChaosMonkey" (Real-Time Chaos Engineering & Data Observability Game)

## 1. Project Overview & Core Mission
Build "ChaosMonkey", a fully functional, real-time multiplayer web application where players compete in a simulated database reliability duel. 
- **The Attacker (Chaos Monkey)** triggers Supabase Edge Functions to inject anomalies, null spikes, and schema drift into a live PostgreSQL database.
- **The Defender (DBA/SRE)** monitors real-time telemetry driven by Sodabase observability triggers, detects anomalies, and executes remediation Edge Functions to restore system health before a 3-minute timer expires.

---

## 2. Tech Stack & Environment
- **Frontend:** React (Vite), TypeScript, Tailwind CSS, Lucide React icons, `@supabase/supabase-js`.
- **Backend & Database:** Supabase (PostgreSQL, Row-Level Security, Realtime Broadcast Channels).
- **Serverless Compute:** Supabase Edge Functions (Deno runtime, TypeScript).
- **Observability Simulation:** Sodabase monitoring configuration and webhook receivers tracking database metrics (row counts, null ratios, schema validation).

---

## 3. Database Schema Requirements (`supabase/migrations/`)
Create the following Postgres tables with appropriate foreign keys, indexes, and RLS policies:
1. **`game_sessions`**: 
   - `id` (UUID, PK)
   - `status` (text: 'waiting', 'active', 'completed')
   - `health_score` (integer, default: 100)
   - `created_at` (timestamptz)
2. **`target_tables`** (Simulated production tables like `transactions`, `user_profiles`):
   - `id` (UUID, PK)
   - `column_name` (text)
   - `data_type` (text)
   - `is_nullable` (boolean)
   - `health_status` (text: 'healthy', 'degraded', 'corrupted')
3. **`chaos_events`** (Audit log of attacks):
   - `id` (UUID, PK)
   - `session_id` (UUID, FK)
   - `attack_type` (text: 'null_injection', 'type_mismatch', 'schema_drift')
   - `payload_summary` (jsonb)
   - `created_at` (timestamptz)

---

## 4. Supabase Edge Functions (`supabase/functions/`)
Implement two primary Deno-based edge functions:
1. **`chaos-injector`**:
   - Accepts POST requests with `{ session_id, attack_type }`.
   - Executes dynamic SQL mutations or data inserts against target tables to simulate realistic database decay (e.g., inserting 500 rows with null emails, or altering a column type).
   - Lowers the session's `health_score` in Postgres based on attack severity.
2. **`sodabase-webhook-handler`**:
   - Listens for mock/live Sodabase anomaly webhooks.
   - Parses data drift metrics (e.g., null ratio > 15%).
   - Broadcasts an event via Supabase Realtime (`session-room`) to update the frontend defender dashboard instantly.

---

## 5. Frontend UI & Experience Requirements (`src/`)
Create a responsive React application with a role-selection screen ('Attacker' vs. 'Defender'):

### A. Attacker Panel UI
- Live control deck with high-impact action buttons: *"Inject Nulls"*, *"Type Mismatch"*, *"Column Eraser"*.
- Cooldown timers on action buttons to prevent spamming.
- Live attack log showing success/failure codes and health score impact.

### B. Defender Dashboard UI
- **Health Bar & Meter:** Real-time animated health gauge (100% down to 0%).
- **Sodabase Radar / Alert Feed:** Live scrolling stream of anomaly alerts received via Supabase Realtime channels (highlighting table name, anomaly type, and severity).
- **Remediation Action Deck:** Quick-action buttons for the defender to trigger clean-up Edge Functions (e.g., *"Quarantine Null Rows"*, *"Rollback Schema"*), which restore health points if executed quickly.

---

## 6. Step-by-Step Execution Plan
1. **Phase 1:** Scaffold the Vite + React + Tailwind project and configure Supabase client utilities.
2. **Phase 2:** Write the SQL migration files for the core tables, indexes, and real-time publication settings.
3. **Phase 3:** Implement the Supabase Edge Functions (`chaos-injector` and `sodabase-webhook-handler`) with proper CORS and environment variable bindings.
4. **Phase 4:** Build the React components (Role Selector, Attacker Deck, Defender Radar, Live Health Gauge).
5. **Phase 5:** Wire up Supabase Realtime subscriptions to sync state seamlessly between attacker actions and defender alerts.

## How it works

### Step 1: Join the Game Room
Both players open the web app. One joins as the Attacker (Chaos Monkey) and the other as the Defender (Database Admin).

### Step 2: The Chaos Phase (Attacker's Turn)
The Attacker sees a control panel full of "Attack Buttons" designed to mess up a fake live database without crashing the entire server:

- **"Inject Nulls":** Secretly floods 500 orders into the system with missing customer emails.
- **"Type Mismatch":** Forces string text into a number field (e.g., writing "one hundred" instead of 100).
- **"Column Eraser":** Simulates a broken code release that suddenly drops a required database column.

The Attacker picks attacks strategically to try and sneak data corruption past the Defender and drop the system's Health Score to zero.

### Step 3: Detection & Alerting (Behind the Scenes)
The attack hits the Supabase database.

Sodabase detects the bad data or broken structure within seconds.

An Edge Function immediately pushes a live alert to the Defender's screen.

### Step 4: Defense & Repair (Defender's Turn)
The Defender sees their health bar drop and red alerts start flashing on their dashboard:

- **The Radar View:** Shows which database table is under attack (e.g., transactions or user_profiles).
- **Alert Details:** Sodabase tells them what went wrong (e.g., "Warning: Null value spike detected in column total_price").
- **Fixing the Bug:** The Defender must quickly click the correct Remediation Action (like "Quarantine Bad Rows" or "Restore Schema Balance") to wipe out the corrupt data, stop the health bleed, and earn points based on how fast they reacted.

### Step 5: Game Over
A 3-minute timer runs out. If the Defender keeps the database health above 0%, they win! The app presents a final score showing Time-to-Detection and Data Cleaned.
