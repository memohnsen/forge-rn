import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const CLERK_ISSUER = "https://clerk.meetcal.app";
const DEBUG_LOGS = Deno.env.get("EDGE_DEBUG_LOGS") === "true";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type JwtPayload = { iss?: string; exp?: number };

function decodeJwt(token: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  return JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validateAuth(req: Request): string {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing authorization header");
  }
  const token = authHeader.slice("Bearer ".length);
  const payload = decodeJwt(token);
  if (payload.iss !== CLERK_ISSUER) throw new Error("Invalid token issuer");
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error("Token expired");
  return token;
}

serve(async (req) => {
  const startedAt = Date.now();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    validateAuth(req);

    const openrouterApiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterApiKey) {
      throw new Error("OPENROUTER_API_KEY not configured");
    }

    const body = await req.json();
    const model = body?.model;
    const messages = body?.messages;
    if (!model || !messages) {
      return jsonResponse(400, { error: "Missing required fields: model and messages" });
    }

    const upstreamResponse = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!upstreamResponse.ok) {
      const details = await upstreamResponse.text();
      return jsonResponse(upstreamResponse.status, {
        error: "OpenRouter API error",
        details,
      });
    }

    const contentType = upstreamResponse.headers.get("content-type") ?? "application/json";
    if (DEBUG_LOGS) {
      console.log(
        `openrouter-proxy ok status=${upstreamResponse.status} duration_ms=${Date.now() - startedAt}`
      );
    }

    // Stream-through to avoid JSON parse + stringify overhead on the edge.
    return new Response(upstreamResponse.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("authorization") || message.includes("token") ? 401 : 500;
    if (DEBUG_LOGS) {
      console.error(`openrouter-proxy error status=${status} duration_ms=${Date.now() - startedAt}`, error);
    }
    return jsonResponse(status, { error: message });
  }
});
