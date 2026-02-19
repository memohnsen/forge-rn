import { trackOpenRouterAPICall } from '@/utils/analytics';
import { convexClient } from '@/app/_layout';
import { api } from '@/convex/_generated/api';

const MODEL = 'google/gemini-3-flash-preview';

type QueryOpenRouterParams = {
  prompt: string;
  token?: string;
  purpose?: string;
};

export async function queryOpenRouter({ prompt, purpose }: QueryOpenRouterParams) {
  const promptLength = prompt.length;
  const purposeValue = purpose ?? 'unspecified';

  try {
    const content = await convexClient.action(api.actions.openrouterProxy.queryOpenRouter, {
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
    });

    trackOpenRouterAPICall(MODEL, purposeValue, promptLength, true);
    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    trackOpenRouterAPICall(MODEL, purposeValue, promptLength, false, message);
    throw error;
  }
}
