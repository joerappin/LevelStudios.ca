-- ============================================================
-- LEVEL STUDIOS — Schéma Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- ACCOUNTS (utilisateurs de l'app)
-- ============================================================
create table if not exists accounts (
  id            text primary key default ('LVL' || floor(random()*900000+100000)::text),
  email         text unique not null,
  name          text not null,
  type          text not null check (type in ('admin','chef_projet','employee','client','clienttest')),
  phone         text,
  company       text,
  tps           text,
  tvq           text,
  client_type   text,
  google_auth   boolean default false,
  pending       boolean default false,
  active        boolean default true,
  created_at    timestamptz default now()
);

-- ============================================================
-- RESERVATIONS
-- ============================================================
create table if not exists reservations (
  id            text primary key,
  client_name   text not null,
  client_email  text not null,
  studio        text not null,
  date          text not null,
  start_time    text not null,
  end_time      text not null,
  service       text not null,
  status        text,
  trashed       boolean default false,
  modified_by   text,
  modified_at   timestamptz,
  created_at    timestamptz default now()
);

-- ============================================================
-- PROJECTS
-- ============================================================
create table if not exists projects (
  id              text primary key,
  title           text not null,
  client_name     text,
  client_email    text,
  studio          text,
  status          text,
  pipeline        text default 'PROD',
  reservation_id  text references reservations(id) on delete set null,
  date            text,
  start_time      text,
  end_time        text,
  service         text,
  files           jsonb default '[]',
  history         jsonb default '[]',
  created_at      timestamptz default now()
);

-- ============================================================
-- EMPLOYEES
-- ============================================================
create table if not exists employees (
  id          text primary key,
  account_id  text references accounts(id) on delete set null,
  name        text not null,
  email       text not null,
  phone       text,
  role_key    text,
  joined_at   text,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ============================================================
-- MESSAGES (SAV clients)
-- ============================================================
create table if not exists messages (
  id          text primary key,
  read        boolean default false,
  replies     jsonb default '[]',
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- INTERNAL MESSAGES
-- ============================================================
create table if not exists internal_messages (
  id          text primary key,
  read        boolean default false,
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- MAILS
-- ============================================================
create table if not exists mails (
  id          text primary key,
  "to"        jsonb default '[]',
  cc          jsonb default '[]',
  attachments jsonb default '[]',
  labels      jsonb default '[]',
  trashed_by  jsonb default '[]',
  read        boolean default false,
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

create table if not exists mail_labels (
  id    text primary key,
  data  jsonb default '{}'
);

-- ============================================================
-- INVOICES
-- ============================================================
create table if not exists invoices (
  id          text primary key,
  type        text check (type in ('invoice','quote')),
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

create table if not exists invoice_template (
  id            integer primary key default 1,
  company       text,
  address       text,
  email         text,
  phone         text,
  website       text,
  payment_terms text,
  bank_info     text,
  footer        text,
  tps           text,
  tvq           text
);

-- ============================================================
-- HOUR PACKS
-- ============================================================
create table if not exists hour_packs (
  id          text primary key,
  hours_used  numeric default 0,
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- PROMO CODES
-- ============================================================
create table if not exists promo_codes (
  id          text primary key,
  code        text unique not null,
  active      boolean default true,
  uses        integer default 0,
  max_uses    integer,
  expires_at  timestamptz,
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- POPUP MESSAGES
-- ============================================================
create table if not exists popup_messages (
  id          text primary key,
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- ALERTS
-- ============================================================
create table if not exists alerts (
  id          text primary key,
  status      text default 'sent',
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- CHECK-INS (pointages)
-- ============================================================
create table if not exists check_ins (
  id          text primary key,
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- LEAVE REQUESTS (congés)
-- ============================================================
create table if not exists leave_requests (
  id          text primary key,
  status      text default 'pending',
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- LEADS
-- ============================================================
create table if not exists leads (
  id          text primary key,
  column_name text default 'Pool Leads',
  history     jsonb default '[]',
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- PROMO / PASSWORD TOKENS
-- ============================================================
create table if not exists pwd_tokens (
  token       text primary key,
  account_id  text,
  email       text,
  name        text,
  type        text,
  expires_at  timestamptz
);

-- ============================================================
-- LOGIN HISTORY
-- ============================================================
create table if not exists login_history (
  id          uuid primary key default uuid_generate_v4(),
  account_id  text not null,
  email       text,
  name        text,
  user_agent  text,
  ip          text,
  created_at  timestamptz default now()
);

-- ============================================================
-- VIDEO METADATA
-- ============================================================
create table if not exists video_metadata (
  id              text primary key,
  reservation_id  text,
  file_name       text,
  status          text,
  retour_count    integer default 0,
  retour_phase    text,
  version         text,
  allow_download  boolean default false,
  visible_to_client boolean default false,
  show_watermark  boolean default false,
  created_at      timestamptz default now()
);

create table if not exists video_comments (
  id          uuid primary key default uuid_generate_v4(),
  video_id    text references video_metadata(id) on delete cascade,
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- PROJECT COMMENTS
-- ============================================================
create table if not exists project_comments (
  id          text primary key,
  project_id  text references projects(id) on delete cascade,
  data        jsonb default '{}',
  created_at  timestamptz default now()
);

-- ============================================================
-- PRICING
-- ============================================================
create table if not exists pricing (
  id        text primary key,
  label     text,
  price     numeric,
  group_name text,
  type      text check (type in ('service','option'))
);

-- ============================================================
-- FEATURE FLAGS
-- ============================================================
create table if not exists feature_flags (
  key     text primary key,
  enabled boolean default true
);

insert into feature_flags (key, enabled) values
  ('subscription_tab', true),
  ('library_tab', true),
  ('dashboard_pack_hours', true),
  ('dashboard_buy_pack', true),
  ('online_booking', true),
  ('promo_codes', true),
  ('popup_communication', true),
  ('employee_checkin', true)
on conflict (key) do nothing;

-- ============================================================
-- EMPLOYEE EXTRAS (profils RH, missions freelance, logiciels)
-- ============================================================
create table if not exists employee_profiles (
  employee_id text primary key references employees(id) on delete cascade,
  data        jsonb default '{}'
);

create table if not exists freelance_missions (
  employee_id text primary key references employees(id) on delete cascade,
  data        jsonb default '{}'
);

create table if not exists employee_software (
  employee_id text primary key references employees(id) on delete cascade,
  licenses    jsonb default '[]'
);
