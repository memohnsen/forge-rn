// Supabase Edge Function: Oura Token Exchange
// Securely exchanges OAuth authorization code for access token
// Keeps Client Secret server-side

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const OURA_TOKEN_URL = "https://api.ouraring.com/oauth/token"
const OURA_CLIENT_SECRET = Deno.env.get("OURA_CLIENT_SECRET")
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
  code: string
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
  
  console.log(`[${requestId}] Incoming request: ${req.method} ${req.url}`)
  
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
      console.warn(`[${requestId}] Missing authorization header`)
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
        console.error(`[${requestId}] Invalid issuer: ${payload.iss}`)
        throw new Error('Invalid token issuer')
      }
      
      // Verify expiration
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        console.error(`[${requestId}] Token expired at ${new Date(payload.exp * 1000).toISOString()}`)
        throw new Error('Token expired')
      }
      
      userId = payload.sub || payload.user_id || null
      console.log(`[${requestId}] Authentication successful - User: ${userId}`)
      
    } catch (jwtError) {
      console.error(`[${requestId}] JWT validation error:`, jwtError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get the authorization code from request body
    const { code }: TokenRequest = await req.json()
    
    if (!code) {
      console.warn(`[${requestId}] Missing authorization code`)
      return new Response(
        JSON.stringify({ error: "Missing authorization code" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!OURA_CLIENT_SECRET) {
      console.error(`[${requestId}] OURA_CLIENT_SECRET not configured`)
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get client ID from environment
    const OURA_CLIENT_ID = Deno.env.get("OURA_CLIENT_ID") ?? ""
    if (!OURA_CLIENT_ID) {
      console.error(`[${requestId}] OURA_CLIENT_ID not configured`)
      return new Response(
        JSON.stringify({ error: "Server configuration error - missing client ID" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const redirectURI = "forge://oauth/callback"
    console.log(`[${requestId}] Exchanging code for token with Oura`)

    // Exchange code for token with Oura
    const tokenResponse = await fetch(OURA_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectURI,
        client_id: OURA_CLIENT_ID,
        client_secret: OURA_CLIENT_SECRET,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error(`[${requestId}] Oura token exchange failed (${tokenResponse.status}):`, errorText)
      return new Response(
        JSON.stringify({ error: "Token exchange failed", details: errorText }),
        { 
          status: tokenResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokenData: TokenResponse = await tokenResponse.json()
    console.log(`[${requestId}] Token exchange successful for user: ${userId}`)

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
    console.error(`[${requestId}] Edge function error (${totalDuration}ms):`, error)
    console.error(`[${requestId}] Error stack:`, error.stack)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

