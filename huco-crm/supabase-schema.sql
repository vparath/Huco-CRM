-- ============================================================
-- HUCO CRM — Supabase Schema
-- Run this in Supabase → SQL Editor
-- ============================================================

-- USER PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Everyone can read profiles
create policy "Profiles readable by authenticated users"
  on public.profiles for select using (auth.role() = 'authenticated');

-- Only admins can update roles
create policy "Only admins can update profiles"
  on public.profiles for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Users can insert their own profile on signup
create policy "Users can insert own profile"
  on public.profiles for insert with check (id = auth.uid());

-- ============================================================
-- CONTACTS
-- ============================================================
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  role text,
  company text,
  email text,
  phone text,
  tags text[] default '{}',
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contacts enable row level security;

create policy "Contacts readable by authenticated users"
  on public.contacts for select using (auth.role() = 'authenticated');

create policy "Members can insert contacts"
  on public.contacts for insert with check (auth.role() = 'authenticated');

create policy "Members can update contacts"
  on public.contacts for update using (auth.role() = 'authenticated');

create policy "Only admins can delete contacts"
  on public.contacts for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- DEALS
-- ============================================================
create table public.deals (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  company text not null,
  amount numeric not null default 0,
  stage text not null default 'prospect' check (stage in ('prospect','proposal','negotiation','verbal_commit','closed_won','closed_lost')),
  probability integer not null default 10 check (probability between 0 and 100),
  contact_id uuid references public.contacts(id),
  owner_id uuid references public.profiles(id),
  close_date date,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.deals enable row level security;

create policy "Deals readable by authenticated users"
  on public.deals for select using (auth.role() = 'authenticated');

create policy "Members can insert deals"
  on public.deals for insert with check (auth.role() = 'authenticated');

create policy "Members can update deals"
  on public.deals for update using (auth.role() = 'authenticated');

create policy "Only admins can delete deals"
  on public.deals for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- PARTNER ENGAGEMENTS
-- ============================================================
create table public.partner_engagements (
  id uuid default gen_random_uuid() primary key,
  partner_name text not null,
  engagement_type text not null check (engagement_type in ('co-sell','technology','reseller','referral')),
  deal_id uuid references public.deals(id),
  status text not null default 'active' check (status in ('active','pending','needs_attention','inactive')),
  contact_name text,
  notes text,
  owner_id uuid references public.profiles(id),
  last_touch timestamptz default now(),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.partner_engagements enable row level security;

create policy "Partners readable by authenticated users"
  on public.partner_engagements for select using (auth.role() = 'authenticated');

create policy "Members can insert partner engagements"
  on public.partner_engagements for insert with check (auth.role() = 'authenticated');

create policy "Members can update partner engagements"
  on public.partner_engagements for update using (auth.role() = 'authenticated');

create policy "Only admins can delete partner engagements"
  on public.partner_engagements for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- ACTIVITIES
-- ============================================================
create table public.activities (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('call','email','meeting','note','follow_up','partner')),
  title text not null,
  description text,
  deal_id uuid references public.deals(id),
  contact_id uuid references public.contacts(id),
  due_date timestamptz,
  completed boolean default false,
  completed_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.activities enable row level security;

create policy "Activities readable by authenticated users"
  on public.activities for select using (auth.role() = 'authenticated');

create policy "Members can insert activities"
  on public.activities for insert with check (auth.role() = 'authenticated');

create policy "Members can update activities"
  on public.activities for update using (auth.role() = 'authenticated');

create policy "Only admins can delete activities"
  on public.activities for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- AI CHAT HISTORY (per user, per session)
-- ============================================================
create table public.ai_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id),
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.ai_messages enable row level security;

create policy "Users can only see their own AI messages"
  on public.ai_messages for select using (user_id = auth.uid());

create policy "Users can insert their own AI messages"
  on public.ai_messages for insert with check (user_id = auth.uid());

-- ============================================================
-- REALTIME — enable for all tables
-- ============================================================
alter publication supabase_realtime add table public.deals;
alter publication supabase_realtime add table public.contacts;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.partner_engagements;

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger deals_updated_at before update on public.deals
  for each row execute function update_updated_at();

create trigger contacts_updated_at before update on public.contacts
  for each row execute function update_updated_at();

create trigger partners_updated_at before update on public.partner_engagements
  for each row execute function update_updated_at();

create trigger activities_updated_at before update on public.activities
  for each row execute function update_updated_at();

-- ============================================================
-- SEED: Huco initial data (run after creating your admin user)
-- Replace 'YOUR-ADMIN-USER-ID' with your actual UUID from auth.users
-- ============================================================

-- Insert sample contacts
insert into public.contacts (full_name, role, company, email, phone, tags) values
('Ahmed Al Khoori', 'Head of IT', 'Mashreq Bank', 'ahmed.alkhoori@mashreq.com', '+971 4 212 0000', ARRAY['NGINX ELA', 'Decision Maker']),
('Sara Rahman', 'IT Director', 'FANR', 's.rahman@fanr.ae', '+971 2 614 4400', ARRAY['DR Migration', 'Champion']),
('Dan Mitchell', 'Partner Manager', 'Red Hat', 'dan.mitchell@redhat.com', '+971 4 000 0000', ARRAY['Partner', 'OpenShift']),
('Khalid Jaber', 'CTO', 'Emirates NBD', 'k.jaber@emiratesnbd.com', '+971 4 316 0316', ARRAY['OpenShift Virt.', 'Prospect']),
('Noura Farhan', 'Procurement Lead', 'DEWA', 'n.farhan@dewa.gov.ae', '+971 4 601 9999', ARRAY['NSX Edge', 'Support']),
('Mohammed Al Suwaidi', 'IT Manager', 'FedNet', 'm.suwaidi@fednet.ae', '+971 2 666 7777', ARRAY['FedNet Cloud', 'Negotiation']);

-- Insert sample deals
insert into public.deals (name, company, amount, stage, probability, close_date, notes) values
('NGINX ELA Renewal', 'Mashreq Bank', 620000, 'negotiation', 70, '2025-03-31', '400-node NGINX Plus, App Protect WAF, NMS. Red Hat co-sell with Dan. Sensitive partner relationship.'),
('DR Migration to FedNet Cloud', 'FANR', 480000, 'proposal', 40, '2025-04-15', 'VMware VCDA, vRNI, NSX Autonomous Edges. 120 VMs across 40 apps. Follow-up overdue.'),
('OpenShift Virtualization', 'Emirates NBD', 310000, 'prospect', 20, '2025-05-30', 'Initial discovery needed.'),
('NSX Autonomous Edge', 'DEWA', 220000, 'proposal', 35, '2025-04-30', 'Proposal submitted, awaiting feedback.'),
('Cloud Infrastructure', 'FedNet', 195000, 'negotiation', 65, '2025-03-28', 'Near close.'),
('RHEL Subscription Renewal', 'Abu Dhabi Health', 110000, 'verbal_commit', 85, '2025-03-20', 'Verbal commit received.'),
('Cloud Platform', 'du Telecom', 185000, 'proposal', 30, '2025-05-15', ''),
('NSX Migration', 'Etisalat', 145000, 'prospect', 15, '2025-06-30', 'Early stage.');
