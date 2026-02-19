"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

export const proxyRequest = action({
  args: {
    endpoint: v.string(),
    method: v.optional(v.string()),
    body: v.optional(v.any()),
    responseType: v.optional(v.union(v.literal("json"), v.literal("base64"))),
  },
  handler: async (ctx, { endpoint, method = "POST", body: requestBody, responseType = "json" }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenlabsApiKey) throw new Error("ELEVENLABS_API_KEY not configured");

    const fullUrl = `${ELEVENLABS_API_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;

    const response = await fetch(fullUrl, {
      method,
      headers: {
        "xi-api-key": elevenlabsApiKey,
        "Content-Type": "application/json",
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    if (responseType === "base64") {
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      return { type: "base64" as const, data: btoa(binary) };
    }

    const data = await response.json();
    return { type: "json" as const, data };
  },
});
