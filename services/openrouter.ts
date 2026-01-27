const MODEL = 'google/gemini-3-flash-preview';

type QueryOpenRouterParams = {
  prompt: string;
  token: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const getEdgeFunctionUrl = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
  }
  return `${supabaseUrl}/functions/v1/openrouter-proxy`;
};

export async function queryOpenRouter({ prompt, token }: QueryOpenRouterParams) {
  const requestUrl = getEdgeFunctionUrl();
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter error (${response.status}): ${errorText || 'Unknown error'}`);
  }

  const json = (await response.json()) as OpenRouterResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter error: Failed to parse response');
  }

  return content;
}
