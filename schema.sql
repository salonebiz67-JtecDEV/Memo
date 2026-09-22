-- Run this in the Supabase SQL editor to set up Memo's tables.

-- Users are already handled by Supabase Auth (auth.users).
-- This table extends that with any extra profile info you want to store.
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  created_at timestamptz default now()
);

-- One row per conversation "thread"
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text default 'New conversation',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Every message in every conversation, so the AI can recall chat history
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role text check (role in ('user', 'assistant')) not null,
  content text not null,
  created_at timestamptz default now()
);

-- Reminders the user has set, with the exact time they should fire
-- and the custom spoken message to say when they do
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  message text not null,
  remind_at timestamptz not null,
  is_recurring boolean default false,
  recurrence_rule text, -- e.g. 'daily', 'weekdays' - only used if is_recurring is true
  is_sent boolean default false,
  created_at timestamptz default now()
);

-- Speeds up "get all messages for this conversation, in order" queries
create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);

-- Speeds up the reminder-checking job's "find due, unsent reminders" query
create index if not exists idx_reminders_due on public.reminders (remind_at) where is_sent = false;
