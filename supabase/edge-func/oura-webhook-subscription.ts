// Supabase Edge Function: Oura Webhook Subscription
// Creates webhook subscriptions using client_id and client_secret (server-side only)
// According to: https://cloud.ouraring.com/v2/docs#section/Webhooks-for-Real-Time-Data-Updates/Setup-Guide

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const OURA_WEBHOOK_URL = "https://api.ouraring.com/v2/webhook/subscription"
const CLERK_ISSUER = "https://clerk.meetcal.app"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to decode JWT without verification
function decodeJWT(token: string) {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }
  
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
  return payload
}

interface SubscriptionRequest {
  callback_url: string
  verification_token: string
  event_type: string
  data_type: string
}

serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  console.log(`[${requestId}] Incoming request: ${req.method} ${req.url}`)
  
  // Handle CORS preflight
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

    // Get request body
    const subscriptionRequest: SubscriptionRequest = await req.json()
    
    if (!subscriptionRequest.callback_url || !subscriptionRequest.verification_token || 
        !subscriptionRequest.event_type || !subscriptionRequest.data_type) {
      console.warn(`[${requestId}] Missing required fields`)
      return new Response(
        JSON.stringify({ error: "Missing required fields: callback_url, verification_token, event_type, data_type" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get Oura credentials from environment
    const OURA_CLIENT_ID = Deno.env.get("OURA_CLIENT_ID") ?? ""
    const OURA_CLIENT_SECRET = Deno.env.get("OURA_CLIENT_SECRET") ?? ""
    
    if (!OURA_CLIENT_ID || !OURA_CLIENT_SECRET) {
      console.error(`[${requestId}] Oura credentials not configured`)
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`[${requestId}] Creating webhook subscription: ${subscriptionRequest.event_type}/${subscriptionRequest.data_type}`)

    // Create webhook subscription with Oura
    const subscriptionResponse = await fetch(OURA_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "x-client-id": OURA_CLIENT_ID,
        "x-client-secret": OURA_CLIENT_SECRET,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        callback_url: subscriptionRequest.callback_url,
        verification_token: subscriptionRequest.verification_token,
        event_type: subscriptionRequest.event_type,
        data_type: subscriptionRequest.data_type,
      }),
    })

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text()
      console.error(`[${requestId}] Oura webhook subscription failed (${subscriptionResponse.status}):`, errorText)
      return new Response(
        JSON.stringify({ error: "Webhook subscription failed", details: errorText }),
        { 
          status: subscriptionResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const subscriptionData = await subscriptionResponse.json()
    console.log(`[${requestId}] Webhook subscription created successfully for user: ${userId}`)
    console.log(`[${requestId}] Oura response:`, JSON.stringify(subscriptionData, null, 2))

    return new Response(
      JSON.stringify(subscriptionData),
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

