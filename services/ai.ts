import { trackEvent } from '@/services/analytics';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const model = 'google/gemini-3-flash-preview';

export const queryOpenRouter = async (prompt: string, getToken: () => Promise<string | null>, purpose = 'general') => {
  const edgeFunctionURL = `${supabaseUrl}/functions/v1/openrouter-proxy`;
  const promptLength = prompt.length;

  const token = await getToken();
  if (!token) {
    trackEvent('openrouter_error', { model, purpose, promptLength, error: 'missing_token' });
    throw new Error('User not authenticated');
  }

  const response = await fetch(edgeFunctionURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    trackEvent('openrouter_error', { model, purpose, promptLength, status: response.status, error: errorText });
    throw new Error(`OpenRouter error: ${errorText}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content ?? '';
  trackEvent('openrouter_success', { model, purpose, promptLength });
  return content;
};
