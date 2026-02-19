"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";
const MODEL = "google/gemini-3-flash-preview";

function processSSMLBreaks(text: string): string {
  return text.replace(/<break\s+time="(\d+\.?\d*)s"\s*\/>/g, (_, seconds) => {
    const secs = parseFloat(seconds);
    if (secs < 1.5) return " ... ";
    if (secs < 3.0) return " ... ... ";
    return " ... ... ... ";
  });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

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
- Include <break time="3.0s" /> tags between major steps to give the athlete time to visualize
- Use <break time="2.0s" /> for shorter pauses between sentences within a section
- Use <break time="1.0s" /> for brief pauses for emphasis
- Keep the total script around 2-3 minutes when read aloud
- Use second person ("you") to speak directly to the athlete
- Keep sentences short and easy to follow
- Use a calm, confident, encouraging tone

Generate only the script text, no titles or headers. Start directly with the visualization guidance.`;
}

export const generate = action({
  args: {
    movement: v.string(),
    cues: v.string(),
    userSport: v.optional(v.string()),
    voiceId: v.string(),
    stability: v.optional(v.number()),
    similarityBoost: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { movement, cues, userSport = "athlete", voiceId, stability = 0.6, similarityBoost = 0.8 }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!openrouterApiKey) throw new Error("OPENROUTER_API_KEY not configured");
    if (!elevenlabsApiKey) throw new Error("ELEVENLABS_API_KEY not configured");

    const prompt = buildVisualizationPrompt(movement, cues, userSport);
    const openRouterStartedAt = Date.now();

    const openrouterResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }] }),
    });

    if (!openrouterResponse.ok) {
      const details = await openrouterResponse.text();
      throw new Error(`OpenRouter API error (${openrouterResponse.status}): ${details}`);
    }

    const openrouterJson = await openrouterResponse.json();
    const script = openrouterJson?.choices?.[0]?.message?.content;
    if (!script) throw new Error("OpenRouter error: Failed to parse response content");
    const openRouterMs = Date.now() - openRouterStartedAt;

    const ttsText = processSSMLBreaks(script);
    const ttsStartedAt = Date.now();

    const elevenlabsResponse = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenlabsApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: ttsText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!elevenlabsResponse.ok) {
      const details = await elevenlabsResponse.text();
      throw new Error(`ElevenLabs API error (${elevenlabsResponse.status}): ${details}`);
    }

    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    const ttsMs = Date.now() - ttsStartedAt;
    const audioBase64 = arrayBufferToBase64(audioBuffer);

    return {
      script,
      audioBase64,
      timingsMs: { openRouter: openRouterMs, textToSpeech: ttsMs },
    };
  },
});
