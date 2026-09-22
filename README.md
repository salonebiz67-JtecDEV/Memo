# Memo — Backend

Personal AI assistant backend: saves chat history to Supabase, talks to
Claude for replies, and checks for due reminders every minute.

## Setup

1. **Create a Supabase project** at supabase.com (if you haven't already).
2. In the Supabase SQL editor, run everything in `schema.sql` to create
   the `profiles`, `conversations`, `messages`, and `reminders` tables.
3. In Supabase, go to Project Settings → API and grab:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (NOT the anon key) → `SUPABASE_SERVICE_ROLE_KEY`
4. Get an Anthropic API key from console.anthropic.com → `ANTHROPIC_API_KEY`
5. Copy `.env.example` to `.env` and fill in the three values above.
6. Install dependencies:
   ```
   npm install
   ```
7. Run locally:
   ```
   npm run dev
   ```
   The server starts on `http://localhost:3000`.

## Deploying to Render

1. Push this folder to a GitHub repo.
2. In Render, create a new **Web Service**, connect the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the same three environment variables from your `.env` file under
   Render's "Environment" tab.
6. Deploy. Render will give you a live URL like
   `https://memo-backend.onrender.com` — that's what your frontend will
   call.

## API endpoints

- `POST /api/chat` — send a message, get Claude's reply, history is
  saved automatically
  - body: `{ userId, conversationId (optional), message }`
- `GET /api/chat/:conversationId` — get full history for a conversation
- `POST /api/reminders` — create a reminder
  - body: `{ userId, message, remindAt, isRecurring, recurrenceRule }`
  - `remindAt` is an ISO timestamp, e.g. `2026-09-23T07:00:00-05:00`
- `GET /api/reminders/:userId` — list a user's upcoming reminders

## Notes

- User accounts/auth are handled by Supabase Auth on the frontend —
  this backend just expects a `userId` (the Supabase auth user's id)
  in requests.
- The reminder cron job currently just logs and marks reminders as
  sent. Once the frontend is built, wire it up to push a web
  notification and trigger the Web Speech API to actually speak the
  message.
