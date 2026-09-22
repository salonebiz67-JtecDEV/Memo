import express from 'express';
import { supabase } from '../supabase.js';

const router = express.Router();

// POST /api/chat
// body: { userId, conversationId (optional), message }
// If no conversationId is given, a new conversation is created.
router.post('/', async (req, res) => {
  try {
    const { userId, conversationId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'userId and message are required' });
    }

    let convoId = conversationId;

    // Create a new conversation if this is the first message
    if (!convoId) {
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({ user_id: userId, title: message.slice(0, 40) })
        .select()
        .single();

      if (convoError) throw convoError;
      convoId = newConvo.id;
    }

    // Save the user's message
    await supabase.from('messages').insert({
      conversation_id: convoId,
      user_id: userId,
      role: 'user',
      content: message,
    });

    // Pull recent history so Claude has context from this conversation
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (historyError) throw historyError;

    // Call Claude with the full conversation history
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    const reply = data?.content?.[0]?.text ?? 'Sorry, I had trouble responding.';

    // Save the assistant's reply
    await supabase.from('messages').insert({
      conversation_id: convoId,
      user_id: userId,
      role: 'assistant',
      content: reply,
    });

    res.json({ conversationId: convoId, reply });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Something went wrong processing the chat.' });
  }
});

// GET /api/chat/:conversationId
// Fetch full history for a conversation (for reloading it in the UI)
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    const { data, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ messages: data });
  } catch (err) {
    console.error('Fetch history error:', err);
    res.status(500).json({ error: 'Could not load conversation history.' });
  }
});

export default router;
