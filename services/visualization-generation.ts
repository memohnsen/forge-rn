import { convexClient } from '@/app/_layout';
import { api } from '@/convex/_generated/api';

type GenerateVisualizationAudioParams = {
  movement: string;
  cues: string;
  voiceId: string;
  userSport: string;
  token?: string;
  stability?: number;
  similarityBoost?: number;
};

export type VisualizationGenerationResult = {
  script: string;
  audioBase64?: string;
  source: 'combined';
  timingsMs?: {
    openRouter?: number;
    textToSpeech?: number;
  };
};

export async function generateVisualizationAudio({
  movement,
  cues,
  voiceId,
  userSport,
  stability,
  similarityBoost,
}: GenerateVisualizationAudioParams): Promise<VisualizationGenerationResult> {
  const result = await convexClient.action(api.actions.generateVisualizationAudio.generate, {
    movement,
    cues,
    userSport,
    voiceId,
    stability,
    similarityBoost,
  });

  return {
    script: result.script,
    audioBase64: result.audioBase64,
    source: 'combined',
    timingsMs: {
      openRouter: result.timingsMs.openRouter,
      textToSpeech: result.timingsMs.textToSpeech,
    },
  };
}
