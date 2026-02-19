"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const queryOpenRouter = action({
  args: {
    model: v.string(),
    messages: v.array(
      v.object({ role: v.string(), content: v.string() })
    ),
  },
  handler: async (ctx, { model, messages }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) throw new Error("OPENROUTER_API_KEY not configured");

    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`OpenRouter API error (${response.status}): ${details}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter error: Failed to parse response");
    return content as string;
  },
});
