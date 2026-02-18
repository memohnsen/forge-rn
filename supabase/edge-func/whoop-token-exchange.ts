// Supabase Edge Function: WHOOP Token Exchange
// Securely exchanges OAuth authorization code for access token
// Keeps Client Secret server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// WHOOP OAuth token URL - verify in WHOOP API docs
// According to WHOOP OAuth 2.0 docs: https://api.prod.whoop.com/oauth/oauth2/token
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"
const WHOOP_CLIENT_SECRET = Deno.env.get("WHOOP_CLIENT_SECRET")
const CLERK_ISSUER = "https://clerk.meetcal.app"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to decode JWT without verification (we'll verify the signature separately)
function decodeJWT(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }
  
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
  return payload
}

interface TokenRequest {
  code?: string
  refresh_token?: string
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  refresh_token?: string
  scope?: string
}

serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  console.log(`[${requestId}] 🔄 WHOOP token exchange - Incoming request: ${req.method} ${req.url}`)
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${requestId}] Handling CORS preflight`)
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify authentication using Clerk JWT
    const authHeader = req.headers.get('Authorization')
    console.log(`[${requestId}] Auth header present: ${!!authHeader}`)
    
    if (!authHeader) {
      console.warn(`[${requestId}] ❌ Missing authorization header`)
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extract Bearer token
    const token = authHeader.replace('Bearer ', '')
    
    let userId: string | null = null
    try {
      // Decode and validate JWT
      const payload = decodeJWT(token)
      console.log(`[${requestId}] JWT decoded - Subject: ${payload.sub}, Issuer: ${payload.iss}`)
      
      // Verify issuer
      if (payload.iss !== CLERK_ISSUER) {
        console.error(`[${requestId}] ❌ Invalid issuer: ${payload.iss}`)
        throw new Error('Invalid token issuer')
      }
      
      // Verify expiration
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        console.error(`[${requestId}] ❌ Token expired at ${new Date(payload.exp * 1000).toISOString()}`)
        throw new Error('Token expired')
      }
      
      userId = payload.sub || payload.user_id || null
      console.log(`[${requestId}] ✅ Authentication successful - User: ${userId}`)
      
    } catch (jwtError) {
      console.error(`[${requestId}] ❌ JWT validation error:`, jwtError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the request body - can be either code (initial exchange) or refresh_token (refresh)
    const body: TokenRequest = await req.json()
    const { code, refresh_token } = body
    
    // Determine if this is a refresh token request or initial exchange
    const isRefresh = !!refresh_token
    
    if (!code && !refresh_token) {
      console.warn(`[${requestId}] ❌ Missing authorization code or refresh token`)
      return new Response(
        JSON.stringify({ error: "Missing authorization code or refresh token" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (isRefresh) {
      console.log(`[${requestId}] 🔄 Refresh token request received (length: ${refresh_token!.length})`)
    } else {
      console.log(`[${requestId}] 📝 Authorization code received (length: ${code!.length})`)
    }

    if (!WHOOP_CLIENT_SECRET) {
      console.error(`[${requestId}] ❌ WHOOP_CLIENT_SECRET not configured`)
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get client ID from environment
    const WHOOP_CLIENT_ID = Deno.env.get("WHOOP_CLIENT_ID") ?? ""
    if (!WHOOP_CLIENT_ID) {
      console.error(`[${requestId}] ❌ WHOOP_CLIENT_ID not configured`)
      return new Response(
        JSON.stringify({ error: "Server configuration error - missing client ID" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Build request body based on grant type
    let requestBody: URLSearchParams
    if (isRefresh) {
      console.log(`[${requestId}] 🔄 Refreshing token with WHOOP`)
      console.log(`[${requestId}] 📤 WHOOP Token URL: ${WHOOP_TOKEN_URL}`)
      console.log(`[${requestId}] 📤 Client ID: ${WHOOP_CLIENT_ID.substring(0, 8)}...`)
      
      // According to WHOOP docs, refresh requests must include scope: "offline"
      requestBody = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refresh_token!,
        client_id: WHOOP_CLIENT_ID,
        client_secret: WHOOP_CLIENT_SECRET,
        scope: "offline", // Required for refresh token requests
      })
    } else {
      const redirectURI = "forge://oauth/callback"
      console.log(`[${requestId}] 🔄 Exchanging code for token with WHOOP`)
      console.log(`[${requestId}] 📤 WHOOP Token URL: ${WHOOP_TOKEN_URL}`)
      console.log(`[${requestId}] 📤 Client ID: ${WHOOP_CLIENT_ID.substring(0, 8)}...`)
      console.log(`[${requestId}] 📤 Redirect URI: ${redirectURI}`)

      requestBody = new URLSearchParams({
        grant_type: "authorization_code",
        code: code!, // Safe to use ! here because we're in the else branch (isRefresh is false)
        redirect_uri: redirectURI,
        client_id: WHOOP_CLIENT_ID,
        client_secret: WHOOP_CLIENT_SECRET,
      })
    }

    // Exchange code/refresh_token for token with WHOOP
    const tokenResponse = await fetch(WHOOP_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
    })

    console.log(`[${requestId}] 📥 WHOOP token response status: ${tokenResponse.status}`)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error(`[${requestId}] ❌ WHOOP token exchange failed (${tokenResponse.status}):`, errorText)
      return new Response(
        JSON.stringify({ error: "Token exchange failed", details: errorText }),
        { 
          status: tokenResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokenData: TokenResponse = await tokenResponse.json()
    console.log(`[${requestId}] ✅ Token exchange successful for user: ${userId}`)
    console.log(`[${requestId}] ✅ Access token length: ${tokenData.access_token.length}`)
    console.log(`[${requestId}] ✅ Has refresh token: ${!!tokenData.refresh_token}`)
    console.log(`[${requestId}] ✅ Token type: ${tokenData.token_type}`)
    if (tokenData.expires_in) {
      console.log(`[${requestId}] ✅ Expires in: ${tokenData.expires_in} seconds`)
    }

    return new Response(
      JSON.stringify({
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        refresh_token: tokenData.refresh_token,
        scope: tokenData.scope,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error(`[${requestId}] ❌ Edge function error (${totalDuration}ms):`, error)
    console.error(`[${requestId}] ❌ Error stack:`, error.stack)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

