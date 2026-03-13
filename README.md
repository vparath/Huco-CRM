# Huco CRM — Deployment Guide

## What's included
- React frontend (all 5 modules + AI assistant)
- Supabase backend (auth, real-time database, role-based access)
- Admin-only user management panel
- AI assistant with live pipeline context

---

## Step 1 — Create a Supabase project (5 min)

1. Go to https://supabase.com → "New project"
2. Name it "huco-crm", choose a region (Frankfurt or Mumbai for UAE latency)
3. Set a strong database password → Create project
4. Once ready, go to **Settings → API**
5. Copy your:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon/public key** (long JWT string)

---

## Step 2 — Run the database schema (3 min)

1. In Supabase, go to **SQL Editor**
2. Open the file `supabase-schema.sql` from this folder
3. Paste the entire contents and click **Run**
4. You should see "Success" — all tables, policies, and seed data are created

---

## Step 3 — Create your admin account (2 min)

1. In Supabase → **Authentication → Users → Add user**
2. Enter your email and a strong password
3. After creation, go to **SQL Editor** and run:

```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-email@here.com';
```

> Note: Your profile row is created automatically on first login. So:
> - First: deploy the app (Step 4)
> - Login once
> - Then run the SQL above to make yourself admin

---

## Step 4 — Deploy to Vercel (5 min)

### Option A — GitHub (recommended)

1. Push this folder to a GitHub repo:
```bash
cd huco-crm
git init
git add .
git commit -m "Huco CRM initial"
git remote add origin https://github.com/YOUR_USERNAME/huco-crm.git
git push -u origin main
```

2. Go to https://vercel.com → "Add New Project" → Import from GitHub
3. Select your repo → Vercel auto-detects React (Create React App)
4. **Before deploying**, add Environment Variables:
   - `REACT_APP_SUPABASE_URL` = your Supabase project URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key
   - `REACT_APP_ANTHROPIC_API_KEY` = your Anthropic API key
5. Click **Deploy** → Done in ~2 minutes

### Option B — Vercel CLI

```bash
npm install -g vercel
cd huco-crm
cp .env.example .env.local
# Edit .env.local with your keys
vercel --prod
```

---

## Step 5 — Add your 4 team members (2 min)

1. Log in to your deployed CRM at your Vercel URL
2. Go to **Admin** panel (only visible to you)
3. Click **"+ Add User"**
4. Fill in their name, email, and a temporary password
5. Share the URL + credentials with them
6. They log in and change their password

---

## Role permissions summary

| Action | Admin (you) | Member |
|--------|-------------|--------|
| View all data | ✅ | ✅ |
| Create/edit records | ✅ | ✅ |
| Delete records | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| Change roles | ✅ | ❌ |
| See Admin panel | ✅ | ❌ |

---

## Real-time sync

All 5 users see live updates automatically — no refresh needed. When someone moves a deal, adds a contact, or logs an activity, everyone's screen updates within ~1 second via Supabase Realtime.

---

## Security notes

- The Anthropic API key in `REACT_APP_ANTHROPIC_API_KEY` is visible client-side. For production, move AI calls to a Vercel serverless function (see `/api/chat` pattern). This is fine for internal team use.
- Supabase Row Level Security (RLS) ensures users can only access data they're permitted to see.
- All authentication is handled by Supabase — passwords are hashed and never stored in plaintext.

---

## Estimated costs (free tiers cover you)

| Service | Free tier | Your usage |
|---------|-----------|------------|
| Supabase | 500MB DB, 2GB bandwidth | Well within limits for 5 users |
| Vercel | Unlimited deployments | Free for this scale |
| Anthropic | Pay per use | ~$0.01–0.05 per AI chat message |

---

## Troubleshooting

**Login fails**: Check that your Supabase URL and anon key are correct in Vercel environment variables. Redeploy after changing env vars.

**"relation does not exist" error**: The SQL schema wasn't run. Go to Supabase SQL Editor and run `supabase-schema.sql`.

**Admin panel not showing**: Make sure your profile row has `role = 'admin'`. Run the UPDATE query in Step 3.

**Real-time not working**: Make sure you enabled real-time in the SQL schema (last section). Check Supabase → Database → Replication.
