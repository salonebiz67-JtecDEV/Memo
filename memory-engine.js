import { supabase } from '../supabase.js';

// After every exchange, check if anything worth remembering long-term
// was said, and save it separately from the raw chat log.
export async function extractMemory(userId, conversationId, userMessage, assistantReply) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: `You extract durable facts worth remembering long-term about a user, from a single chat exchange. Only extract facts that would still be true weeks from now (routines, preferences, ongoing projects, people in their life, decisions they made). Ignore small talk, one-off questions, and anything not clearly stated. Respond ONLY with a JSON array of objects like {"content": "...", "category": "routine|preference|project|person|other"}. If there is nothing worth remembering, respond with an empty array: []`,
        messages: [
          {
            role: 'user',
            content: `User said: "${userMessage}"\nAssistant replied: "${assistantReply}"`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data?.content?.[0]?.text ?? '[]';
    const cleaned = text.replace(/```json|```/g, '').trim();
    const facts = JSON.parse(cleaned);

    for (const fact of facts) {
      await supabase.from('memories').insert({
        user_id: userId,
        content: fact.content,
        category: fact.category ?? 'other',
        source_conversation_id: conversationId,
      });
    }

    return facts;
  } catch (err) {
    // Memory extraction failing should never break the actual chat reply
    console.error('Memory extraction failed:', err);
    return [];
  }
}

// Pull the user's stored memories to inject into the system prompt.
// Keeping this simple for now (most recent N facts); can be upgraded
// to similarity search later if the memory list grows large.
export async function getRelevantMemories(userId, limit = 30) {
  const { data, error } = await supabase
    .from('memories')
    .select('content, category')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Fetching memories failed:', error);
    return [];
  }

  return data;
}

// Formats memories into a block of text to drop into the system prompt
export function formatMemoriesForPrompt(memories) {
  if (!memories.length) return 'No stored memories yet.';

  return memories.map((m) => `- (${m.category}) ${m.content}`).join('\n');
}
