import { trackElevenLabsAPICall } from '@/utils/analytics';

export type VoiceOption = {
  id: string;
  name: string;
  description: string;
};

export const VOICES: VoiceOption[] = [
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Warm' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Resonant' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Steady' },
];

type TextToSpeechParams = {
  text: string;
  voiceId: string;
  token: string;
  stability?: number;
  similarityBoost?: number;
};

const getEdgeFunctionUrl = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL');
  }
  return `${supabaseUrl}/functions/v1/elevenlabs`;
};

function processSSMLBreaks(text: string): string {
  // Convert SSML break tags to pause markers for ElevenLabs
  const breakPattern = /<break\s+time="(\d+\.?\d*)s"\s*\/>/g;

  return text.replace(breakPattern, (_, seconds) => {
    const secs = parseFloat(seconds);
    if (secs < 1.5) {
      return ' ... ';
    } else if (secs < 3.0) {
      return ' ... ... ';
    } else {
      return ' ... ... ... ';
    }
  });
}

export async function textToSpeech({
  text,
  voiceId,
  token,
  stability = 0.5,
  similarityBoost = 0.75,
}: TextToSpeechParams): Promise<ArrayBuffer> {
  const requestUrl = getEdgeFunctionUrl();
  const processedText = processSSMLBreaks(text);
  const textLength = text.length;

  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: `/text-to-speech/${voiceId}`,
        method: 'POST',
        body: {
          text: processedText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style: 0.0,
            use_speaker_boost: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs error (${response.status}): ${errorText || 'Unknown error'}`);
    }

    const audio = await response.arrayBuffer();
    trackElevenLabsAPICall(voiceId, textLength, null, true);
    return audio;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    trackElevenLabsAPICall(voiceId, textLength, null, false, message);
    throw error;
  }
}
