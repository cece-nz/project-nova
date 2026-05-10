# 🌟 Nova Care

A mobile-first care tracking app for logging medications, fluid intake, output checks, and daily notes.

---

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend/DB**: Supabase (Postgres + RLS)
- **Hosting**: Netlify

---

## Setup Guide

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Name it `project-nova` (or anything you like)
3. Choose a strong database password and save it somewhere safe
4. Wait for the project to spin up (~1 min)

### 2. Run the database schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this project
3. Paste the entire contents and click **Run**
4. You should see all tables created successfully

This will also create an initial **Admin** carer with PIN `1234`.  
**Change this PIN immediately after first login** (via Admin panel).

### 3. Get your Supabase credentials

1. In Supabase, go to **Settings → API**
2. Copy your **Project URL** and **anon public** key

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Netlify

### Option A: Netlify CLI (quickest)

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --build --prod
```

When prompted, set build command: `npm run build`, publish directory: `dist`.

### Option B: Netlify Dashboard

1. Push this project to a GitHub repo
2. Go to [netlify.com](https://netlify.com) → New site from Git
3. Connect your repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Click **Deploy**

### Set environment variables in Netlify

In your Netlify site: **Site settings → Environment variables → Add variable**

Add both:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Then trigger a redeploy.

---

## First-time setup in the app

1. Log in as **Admin** with PIN **1234**
2. Go to **Admin tab**
3. Add your medications (name, dose, scheduled times)
4. Add carers (name + 4-digit PIN + colour)
5. Go back to Admin and **change your PIN** from 1234 to something secure

---

## How to use

### Countdown timer
The purple/red card at the top shows how long since the last output check. It turns amber at 75% of 4 hours, and red when overdue. Tap **Log now** to record a new output check.

### Logging entries
Use the four buttons at the bottom of the screen:
- **Output** – nappy weight, catheter ml, potty ml (the 4-hourly routine)
- **Fluid** – ml in, fluid type
- **Medication** – select from your medication list, dose pre-filled
- **Note** – free text with category

### Daily summary
Switch to the **Summary** tab to see auto-generated totals for the day and write a manual shift handover note.

### Admin
Admins can add/manage carers and medications. Only accounts with `role = 'admin'` see this tab.

---

## Supabase RLS notes

The schema uses the **service role** approach — all authenticated app requests are trusted. Your anon key is safe to use client-side because RLS is enabled on all tables. The app handles its own PIN-based authentication on top.

If you want stricter RLS (per-user row access), that can be added later by integrating Supabase Auth JWT tokens.

---

## Folder structure

```
src/
  components/
    auth/         LoginScreen
    dashboard/    Dashboard, CountdownCard, StatsBar, Timeline, DailySummaryView, AdminPanel
    forms/        MedicationForm, FluidForm, OutputForm, NoteForm
    layout/       ActionBar
    ui/           Modal, FormElements
  hooks/          useAuth, useCountdown
  lib/            supabase.ts, auth.ts, db.ts
  types/          index.ts
  utils/          index.ts
supabase/
  schema.sql
```

---

## Troubleshooting

**"Missing Supabase environment variables"**  
→ Check your `.env.local` file exists and has the correct values. Restart `npm run dev` after editing.

**"Carer not found" on login**  
→ Make sure you ran the schema SQL. The Admin carer is seeded automatically.

**PIN login not working**  
→ The seed uses bcrypt hash of `1234`. If you changed the hash manually, ensure it was generated with bcrypt (10 rounds).

**Netlify deploy blank page**  
→ Check environment variables are set in Netlify dashboard and redeploy.
