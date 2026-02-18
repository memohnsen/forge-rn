// Supabase Edge Function: WHOOP Webhook Handler
// Handles webhook events from WHOOP API
// Processes incoming webhook notifications and fetches full data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer"

interface WebhookEvent {
  event_type: string
  resource_id: string
  event_time: string
  user_id: string
}

interface WebhookVerification {
  challenge?: string
}

serve(async (req) => {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  console.log(`[${requestId}] 🔔 WHOOP webhook - Incoming request: ${req.method} ${req.url}`)
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log(`[${requestId}] Handling CORS preflight`)
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    })
  }

  try {
    // Handle GET request for webhook verification
    // WHOOP sends: GET /whoop-webhook?verification_token=...&challenge=...
    if (req.method === "GET") {
      try {
        console.log(`[${requestId}] 📋 Handling webhook verification (GET request)`)
        
        // Construct full URL if needed (Supabase provides full URL in req.url)
        const urlString = req.url
        const url = new URL(urlString)
        const verificationToken = url.searchParams.get("verification_token")
        const challenge = url.searchParams.get("challenge")
        
        console.log(`[${requestId}] 📋 Webhook verification request:`, { 
          url: urlString, 
          hasToken: !!verificationToken, 
          hasChallenge: !!challenge 
        })
        
        // Get verification token from environment (should match what we send when creating subscription)
        const EXPECTED_VERIFICATION_TOKEN = Deno.env.get("WHOOP_WEBHOOK_VERIFICATION_TOKEN") ?? ""
        
        if (!challenge) {
          console.error(`[${requestId}] ❌ Missing challenge parameter in verification request`)
          return new Response(
            JSON.stringify({ error: "Missing challenge parameter" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        }
        
        // Verify the token matches (if configured)
        if (EXPECTED_VERIFICATION_TOKEN && verificationToken !== EXPECTED_VERIFICATION_TOKEN) {
          console.warn(`[${requestId}] ⚠️ Invalid verification token received`, { 
            expected: EXPECTED_VERIFICATION_TOKEN ? "***" : "not set",
            received: verificationToken ? "***" : "missing"
          })
          return new Response(
            "Invalid verification token",
            { status: 401 }
          )
        }
        
        console.log(`[${requestId}] ✅ Webhook verification successful, returning challenge`)
        // Return the challenge as required by WHOOP
        return new Response(
          JSON.stringify({ challenge }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        )
      } catch (getError) {
        console.error(`[${requestId}] ❌ Error handling GET request:`, getError)
        return new Response(
          JSON.stringify({ error: "Error processing verification request", message: getError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    // Handle POST request for webhook events
    console.log(`[${requestId}] 📨 Handling webhook event (POST request)`)
    const body = await req.json()
    console.log(`[${requestId}] 📨 Webhook event body:`, JSON.stringify(body, null, 2))

    // Handle webhook event
    const event: WebhookEvent = body

    if (!event.event_type || !event.resource_id || !event.user_id) {
      console.error(`[${requestId}] ❌ Invalid webhook event - missing required fields`)
      console.error(`[${requestId}] ❌ Event type: ${event.event_type || "missing"}`)
      console.error(`[${requestId}] ❌ Resource ID: ${event.resource_id || "missing"}`)
      console.error(`[${requestId}] ❌ User ID: ${event.user_id || "missing"}`)
      return new Response(
        JSON.stringify({ error: "Invalid webhook event" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`[${requestId}] 📊 Webhook event received:`, {
      event_type: event.event_type,
      resource_id: event.resource_id,
      user_id: event.user_id,
      event_time: event.event_time,
    })

    // TODO: Retrieve user's WHOOP access token from Keychain (stored in iOS app)
    // For now, we'll log the event and return success quickly
    // The iOS app can fetch the full data later using the resource_id
    console.log(`[${requestId}] ℹ️ Webhook event logged - iOS app will fetch full data using resource_id: ${event.resource_id}`)
    
    // Note: We should verify the signature header for security
    // const signature = req.headers.get("x-whoop-signature")
    // const timestamp = req.headers.get("x-whoop-timestamp")
    // Verify signature using HMAC with client secret

    // Return success to WHOOP
    const totalDuration = Date.now() - startTime
    console.log(`[${requestId}] ✅ Webhook processed successfully (${totalDuration}ms)`)
    
    return new Response(
      JSON.stringify({ status: "success" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error(`[${requestId}] ❌ Webhook error (${totalDuration}ms):`, error)
    console.error(`[${requestId}] ❌ Error stack:`, error.stack)
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

