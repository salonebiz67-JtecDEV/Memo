-- User-configurable preferences for how Memo behaves.
-- One row per user, with sensible defaults.
create table if not exists public.settings (
  user_id uuid references auth.users on delete cascade primary key,
  timezone text default 'UTC',              -- e.g. 'America/Chicago' - used to interpret reminder times correctly
  voice_enabled boolean default true,       -- whether reminders should be spoken aloud (TTS)
  notification_style text default 'both',   -- 'notification', 'voice', or 'both'
  assistant_tone text default 'casual',     -- 'casual', 'formal', 'direct' - shapes the system prompt's tone
  memory_enabled boolean default true,      -- whether Memo saves long-term memories at all
  updated_at timestamptz default now()
);
