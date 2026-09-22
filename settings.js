import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// GET /api/settings/:userId
// Returns the user's settings, creating defaults if none exist yet
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    let { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // No row yet -> create one with defaults
    if (error && error.code === 'PGRST116') {
      const { data: created, error: createError } = await supabase
        .from('settings')
        .insert({ user_id: userId })
        .select()
        .single();

      if (createError) throw createError;
      data = created;
    } else if (error) {
      throw error;
    }

    res.json({ settings: data });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Could not load settings.' });
  }
});

// PUT /api/settings/:userId
// body: any subset of { timezone, voiceEnabled, notificationStyle, assistantTone, memoryEnabled }
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timezone, voiceEnabled, notificationStyle, assistantTone, memoryEnabled } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (timezone !== undefined) updates.timezone = timezone;
    if (voiceEnabled !== undefined) updates.voice_enabled = voiceEnabled;
    if (notificationStyle !== undefined) updates.notification_style = notificationStyle;
    if (assistantTone !== undefined) updates.assistant_tone = assistantTone;
    if (memoryEnabled !== undefined) updates.memory_enabled = memoryEnabled;

    const { data, error } = await supabase
      .from('settings')
      .upsert({ user_id: userId, ...updates })
      .select()
      .single();

    if (error) throw error;

    res.json({ settings: data });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Could not update settings.' });
  }
});

export default router;
