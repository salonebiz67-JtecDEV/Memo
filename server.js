import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { supabase } from './supabase.js';
import chatRouter from './routes/chat.js';
import remindersRouter from './routes/reminders.js';
import settingsRouter from './routes/settings.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/settings', settingsRouter);

app.get('/', (req, res) => {
  res.send('Memo backend is running.');
});

// --- Reminder checker ---
// Runs every minute. Finds reminders that are due and haven't been sent yet.
// For now this logs + marks them sent; hook in push notifications here
// (e.g. web push, or later a native mobile push service) once the
// frontend is ready to receive them.
cron.schedule('* * * * *', async () => {
  const now = new Date().toISOString();

  const { data: dueReminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('is_sent', false)
    .lte('remind_at', now);

  if (error) {
    console.error('Reminder check failed:', error);
    return;
  }

  for (const reminder of dueReminders) {
    console.log(`Reminder due for user ${reminder.user_id}: "${reminder.message}"`);

    // TODO: send a push notification to the frontend here so it can
    // display the alert and speak `reminder.message` aloud via the
    // Web Speech API.

    await supabase
      .from('reminders')
      .update({ is_sent: true })
      .eq('id', reminder.id);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Memo backend listening on port ${PORT}`);
});
