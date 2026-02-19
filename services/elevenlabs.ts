import { trackElevenLabsAPICall } from '@/utils/analytics';
import { convexClient } from '@/app/_layout';
import { api } from '@/convex/_generated/api';

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
  token?: string;
  stability?: number;
  similarityBoost?: number;
};

function processSSMLBreaks(text: string): string {
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

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function textToSpeech({
  text,
  voiceId,
  stability = 0.5,
  similarityBoost = 0.75,
}: TextToSpeechParams): Promise<ArrayBuffer> {
  const processedText = processSSMLBreaks(text);
  const textLength = text.length;

  try {
    const result = await convexClient.action(api.actions.elevenlabsProxy.proxyRequest, {
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
      responseType: 'base64',
    });

    if (result.type !== 'base64') {
      throw new Error('ElevenLabs: expected base64 audio response');
    }

    const audio = base64ToArrayBuffer(result.data as string);
    trackElevenLabsAPICall(voiceId, textLength, null, true);
    return audio;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    trackElevenLabsAPICall(voiceId, textLength, null, false, message);
    throw error;
  }
}
