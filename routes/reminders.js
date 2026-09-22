import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// POST /api/reminders
// body: { userId, message, remindAt, isRecurring, recurrenceRule }
// remindAt should be an ISO timestamp, e.g. "2026-09-23T07:00:00-05:00"
router.post('/', async (req, res) => {
  try {
    const { userId, message, remindAt, isRecurring, recurrenceRule } = req.body;

    if (!userId || !message || !remindAt) {
      return res.status(400).json({ error: 'userId, message, and remindAt are required' });
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: userId,
        message,
        remind_at: remindAt,
        is_recurring: !!isRecurring,
        recurrence_rule: recurrenceRule ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ reminder: data });
  } catch (err) {
    console.error('Create reminder error:', err);
    res.status(500).json({ error: 'Could not create reminder.' });
  }
});

// GET /api/reminders/:userId
// List all upcoming, unsent reminders for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_sent', false)
      .order('remind_at', { ascending: true });

    if (error) throw error;

    res.json({ reminders: data });
  } catch (err) {
    console.error('List reminders error:', err);
    res.status(500).json({ error: 'Could not load reminders.' });
  }
});

export default router;
