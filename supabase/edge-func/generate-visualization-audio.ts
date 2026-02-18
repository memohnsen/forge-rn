import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CLERK_ISSUER = "https://clerk.meetcal.app";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";
const MODEL = "google/gemini-3-flash-preview";
const DEBUG_LOGS = Deno.env.get("EDGE_DEBUG_LOGS") === "true";
const AUDIO_URL_TTL_SECONDS = 15 * 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type JwtPayload = { iss?: string; exp?: number };
type GenerateVisualizationRequest = {
  movement: string;
  cues: string;
  userSport?: string;
  voiceId: string;
  stability?: number;
  similarityBoost?: number;
  responseMode?: "base64" | "url" | "auto";
};

type AudioUploadResult = {
  audioUrl: string;
  expiresAt: string;
  objectPath: string;
};

function decodeJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
}

function validateAuth(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Missing authorization header");

  const token = authHeader.slice("Bearer ".length);
  const payload = decodeJwt(token);
  if (payload.iss !== CLERK_ISSUER) throw new Error("Invalid token issuer");

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error("Token expired");
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function toAbsoluteStorageUrl(supabaseUrl: string, signedUrl: string): string {
  if (signedUrl.startsWith("http://") || signedUrl.startsWith("https://")) {
    return signedUrl;
  }
  const normalized = signedUrl.startsWith("/") ? signedUrl : `/${signedUrl}`;
  return `${supabaseUrl}/storage/v1${normalized}`;
}

async function uploadAudioAndCreateSignedUrl(audioBuffer: ArrayBuffer): Promise<AudioUploadResult | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const bucket = Deno.env.get("VISUALIZATION_AUDIO_BUCKET");
  if (!supabaseUrl || !serviceRoleKey || !bucket) {
    return null;
  }

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const objectPath = `visualizations/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.mp3`;
  const uploadBytes = new Uint8Array(audioBuffer);
  const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, uploadBytes, {
    contentType: "audio/mpeg",
    cacheControl: `${AUDIO_URL_TTL_SECONDS}`,
    upsert: false,
  });
  if (uploadError) {
    throw new Error(`Audio upload failed: ${uploadError.message}`);
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(objectPath, AUDIO_URL_TTL_SECONDS);
  if (signError || !signed?.signedUrl) {
    throw new Error(`Audio signing failed: ${signError?.message ?? "missing signed URL"}`);
  }

  return {
    audioUrl: toAbsoluteStorageUrl(supabaseUrl, signed.signedUrl),
    expiresAt: new Date(Date.now() + AUDIO_URL_TTL_SECONDS * 1000).toISOString(),
    objectPath,
  };
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

serve(async (req) => {
  const startedAt = Date.now();
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    validateAuth(req);

    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!openrouterApiKey) throw new Error("OPENROUTER_API_KEY not configured");
    if (!elevenlabsApiKey) throw new Error("ELEVENLABS_API_KEY not configured");

    const {
      movement,
      cues,
      userSport = "athlete",
      voiceId,
      stability = 0.6,
      similarityBoost = 0.8,
      responseMode = "base64",
    } = (await req.json()) as GenerateVisualizationRequest;

    if (!movement || !cues || !voiceId) {
      return jsonResponse(400, { error: "Missing required fields: movement, cues, voiceId" });
    }

    const prompt = buildVisualizationPrompt(movement, cues, userSport);
    const openRouterStartedAt = Date.now();
    const openrouterResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!openrouterResponse.ok) {
      const details = await openrouterResponse.text();
      return jsonResponse(openrouterResponse.status, {
        error: "OpenRouter API error",
        details,
      });
    }

    const openrouterJson = await openrouterResponse.json();
    const script = openrouterJson?.choices?.[0]?.message?.content;
    if (!script) {
      return jsonResponse(502, { error: "OpenRouter error: Failed to parse response content" });
    }
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
      return jsonResponse(elevenlabsResponse.status, {
        error: "ElevenLabs API error",
        details,
      });
    }

    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    const ttsMs = Date.now() - ttsStartedAt;
    let audioUrl: string | undefined;
    let expiresAt: string | undefined;
    let storageObjectPath: string | undefined;
    if (responseMode !== "base64") {
      try {
        const uploaded = await uploadAudioAndCreateSignedUrl(audioBuffer);
        if (uploaded) {
          audioUrl = uploaded.audioUrl;
          expiresAt = uploaded.expiresAt;
          storageObjectPath = uploaded.objectPath;
        }
      } catch (uploadError) {
        if (DEBUG_LOGS) {
          console.warn("generate-visualization-audio upload/sign failed, falling back to base64", uploadError);
        }
      }
    }

    const audioBase64 = audioUrl ? undefined : arrayBufferToBase64(audioBuffer);
    const totalMs = Date.now() - startedAt;

    if (DEBUG_LOGS) {
      console.log(
        `generate-visualization-audio ok total_ms=${totalMs} openrouter_ms=${openRouterMs} tts_ms=${ttsMs}`
      );
    }

    return jsonResponse(200, {
      script,
      audioUrl,
      expiresAt,
      storageObjectPath,
      audioBase64,
      timingsMs: {
        total: totalMs,
        openRouter: openRouterMs,
        textToSpeech: ttsMs,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("authorization") || message.includes("token") ? 401 : 500;
    if (DEBUG_LOGS) {
      console.error(`generate-visualization-audio error status=${status}`, error);
    }
    return jsonResponse(status, { error: message });
  }
});
