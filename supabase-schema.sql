-- ============================================================
-- FreeShelf — Supabase Schema
-- Run this in your Supabase project SQL editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Wishlist ─────────────────────────────────────────────────────────
create table if not exists wishlist (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null,              -- Clerk user ID
  deal_id     text not null,
  deal_title  text not null,
  platform    text not null,
  added_at    timestamptz not null default now(),

  unique (user_id, deal_id)
);

create index if not exists wishlist_user_id_idx on wishlist (user_id);
create index if not exists wishlist_deal_id_idx on wishlist (deal_id);

-- ─── User Preferences ─────────────────────────────────────────────────
create table if not exists user_preferences (
  user_id           text primary key,     -- Clerk user ID
  favorite_genres   text[] default '{}',
  favorite_platforms text[] default '{}',
  notify_email      boolean default false,
  theme             text default 'dark',
  updated_at        timestamptz default now()
);

-- ─── Deal History ─────────────────────────────────────────────────────
-- Keeps a snapshot every time a deal is seen — enables "gone free X times" feature
create table if not exists deal_history (
  id             uuid primary key default uuid_generate_v4(),
  deal_id        text not null,
  title          text not null,
  platform       text not null,
  original_price numeric(10,2),
  end_date       timestamptz,
  seen_at        timestamptz not null default now(),

  unique (deal_id, seen_at)
);

create index if not exists deal_history_title_idx on deal_history (lower(title));
create index if not exists deal_history_platform_idx on deal_history (platform);

-- ─── Row Level Security ───────────────────────────────────────────────
-- We use Clerk for auth, so RLS is enforced at the API route level.
-- These policies allow the service role key full access.

alter table wishlist enable row level security;
alter table user_preferences enable row level security;
alter table deal_history enable row level security;

-- Service role bypasses RLS automatically (used in API routes)
-- For direct client queries (future), add user-scoped policies:

-- Example policy (add when using browser client directly):
-- create policy "Users can manage their own wishlist"
--   on wishlist
--   for all
--   using (user_id = auth.uid()::text);

-- ─── Email Notifications ──────────────────────────────────────────────
-- Tracks which deals have already been emailed to each user (prevents re-sending)
create table if not exists email_notifications_sent (
  id         uuid primary key default uuid_generate_v4(),
  user_id    text not null,
  deal_id    text not null,
  sent_at    timestamptz not null default now(),
  unique (user_id, deal_id)
);

create index if not exists email_notif_user_idx on email_notifications_sent (user_id);
create index if not exists email_notif_deal_idx  on email_notifications_sent (deal_id);

-- Email opt-in stored in user_preferences.notify_email (already exists)
-- Unsubscribe tokens for one-click unsubscribe
create table if not exists unsubscribe_tokens (
  token      text primary key,
  user_id    text not null unique,
  created_at timestamptz not null default now()
);
