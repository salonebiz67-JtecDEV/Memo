-- Long-term memory: distilled facts about the user, separate from the
-- raw chat log in `messages`. This is what makes Memo feel like it
-- "remembers you" without re-reading the entire chat history every time.
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  content text not null,           -- e.g. "Wakes up at 7am on weekdays"
  category text,                   -- e.g. 'routine', 'preference', 'project', 'person'
  source_conversation_id uuid references public.conversations on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_memories_user on public.memories (user_id, category);
