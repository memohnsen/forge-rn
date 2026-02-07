import { textToSpeech } from '@/services/elevenlabs';
import { queryOpenRouter } from '@/services/openrouter';

type GenerateVisualizationAudioParams = {
  movement: string;
  cues: string;
  voiceId: string;
  userSport: string;
  token: string;
  stability?: number;
  similarityBoost?: number;
};

export type VisualizationGenerationResult = {
  script: string;
  audioData?: ArrayBuffer;
  audioBase64?: string;
  audioUrl?: string;
  expiresAt?: string;
  source: 'combined' | 'legacy';
  timingsMs?: {
    total?: number;
    openRouter?: number;
    textToSpeech?: number;
  };
};

type CombinedVisualizationResponse = {
  script?: string;
  audioUrl?: string;
  expiresAt?: string;
  audioBase64?: string;
  timingsMs?: {
    total?: number;
    openRouter?: number;
    textToSpeech?: number;
  };
};

const getCombinedEdgeUrl = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
  }
  return `${supabaseUrl}/functions/v1/generate-visualization-audio`;
};

function buildVisualizationPrompt(movement: string, cues: string, userSport: string): string {
  return `You are a professional ${userSport} coach creating a guided visualization script for an athlete preparing for a movement.

The athlete wants to visualize: ${movement}
Their personal cues to focus on: ${cues}

Create a calming, focused visualization script that:
1. Starts by having them close their eyes and take deep breaths
2. Guides them to visualize approaching and setting up for the movement
3. Walks through the setup phase incorporating their specific cues
4. Describes the execution with vivid sensory detail
5. Emphasizes feeling strong, confident, and in control
6. Ends with successfully completing the movement and the feeling of accomplishment

Tone:
- Sound confident, but not robotic. Remember you're speaking to a person.

IMPORTANT FORMATTING RULES:
- Include <break time="2.0s" /> tags between major steps to give the athlete time to visualize
- Use <break time="1.5s" /> for shorter pauses between sentences within a section
- Use <break time="1.0s" /> for brief pauses for emphasis
- Keep the total script around 1.5-2 minutes when read aloud
- Use second person ("you") to speak directly to the athlete
- Keep sentences short and easy to follow
- Use a calm, confident, encouraging tone

Example pacing:
  "Close your eyes and take a deep breath in... <break time="2.0s" /> And slowly release. <break time="1.5s" /> Feel your body becoming calm and focused. <break time="1.5s" />"

Generate only the script text, no titles or headers. Start directly with the visualization guidance.`;
}

export async function generateVisualizationAudio({
  movement,
  cues,
  voiceId,
  userSport,
  token,
  stability,
  similarityBoost,
}: GenerateVisualizationAudioParams): Promise<VisualizationGenerationResult> {
  try {
    const combinedResponse = await fetch(getCombinedEdgeUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        movement,
        cues,
        userSport,
        voiceId,
        stability,
        similarityBoost,
        responseMode: 'base64',
      }),
    });

    if (combinedResponse.ok) {
      const json = (await combinedResponse.json()) as CombinedVisualizationResponse;
      if (json.script && json.audioUrl) {
        return {
          script: json.script,
          audioUrl: json.audioUrl,
          expiresAt: json.expiresAt,
          source: 'combined',
          timingsMs: {
            total: json.timingsMs?.total,
            openRouter: json.timingsMs?.openRouter,
            textToSpeech: json.timingsMs?.textToSpeech,
          },
        };
      }

      if (json.script && json.audioBase64) {
        return {
          script: json.script,
          audioBase64: json.audioBase64,
          source: 'combined',
          timingsMs: {
            total: json.timingsMs?.total,
            openRouter: json.timingsMs?.openRouter,
            textToSpeech: json.timingsMs?.textToSpeech,
          },
        };
      }
      throw new Error('Combined response missing script or audio');
    }
  } catch {
    // Fallback to legacy two-call flow during rollout.
  }

  const prompt = buildVisualizationPrompt(movement, cues, userSport);
  const openRouterStart = Date.now();
  const script = await queryOpenRouter({
    prompt,
    token,
    purpose: 'visualization_script',
  });
  const openRouterMs = Date.now() - openRouterStart;

  const textToSpeechStart = Date.now();
  const audioData = await textToSpeech({
    text: script,
    voiceId,
    token,
    stability,
    similarityBoost,
  });
  const textToSpeechMs = Date.now() - textToSpeechStart;

  return {
    script,
    audioData,
    source: 'legacy',
    timingsMs: {
      total: openRouterMs + textToSpeechMs,
      openRouter: openRouterMs,
      textToSpeech: textToSpeechMs,
    },
  };
}
