"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";

const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token";
const REDIRECT_URI = "forge://oauth/callback";

export const exchangeToken = action({
  args: {
    code: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
  },
  handler: async (ctx, { code, refreshToken }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const clientId = process.env.OURA_CLIENT_ID;
    const clientSecret = process.env.OURA_CLIENT_SECRET;
    if (!clientId) throw new Error("OURA_CLIENT_ID not configured");
    if (!clientSecret) throw new Error("OURA_CLIENT_SECRET not configured");

    let body: URLSearchParams;
    if (refreshToken) {
      body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      });
    } else if (code) {
      body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        client_secret: clientSecret,
      });
    } else {
      throw new Error("Must provide code or refreshToken");
    }

    const response = await fetch(OURA_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<{
      access_token: string;
      token_type: string;
      expires_in?: number;
      refresh_token?: string;
      scope?: string;
    }>;
  },
});
