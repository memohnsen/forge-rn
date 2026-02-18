// Supabase Edge Function: Oura Webhook Handler
// Handles webhook events from Oura API
// Processes incoming webhook notifications and fetches full data

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OURA_API_BASE = "https://api.ouraring.com/v2"

interface WebhookEvent {
  event_type: string
  data_type: string
  object_id: string
  event_time: string
  user_id: string
}

interface WebhookVerification {
  challenge?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    })
  }

  try {
    // Handle GET request for webhook verification (Step 3 in Oura docs)
    // Oura sends: GET /oura-webhook?verification_token=...&challenge=...
    if (req.method === "GET") {
      try {
        // Construct full URL if needed (Supabase provides full URL in req.url)
        const urlString = req.url
        const url = new URL(urlString)
        const verificationToken = url.searchParams.get("verification_token")
        const challenge = url.searchParams.get("challenge")
        
        console.log("Webhook verification request:", { 
          url: urlString, 
          hasToken: !!verificationToken, 
          hasChallenge: !!challenge 
        })
        
        // Get verification token from environment (should match what we send when creating subscription)
        const EXPECTED_VERIFICATION_TOKEN = Deno.env.get("OURA_WEBHOOK_VERIFICATION_TOKEN") ?? ""
        
        if (!challenge) {
          console.error("Missing challenge parameter in verification request")
          return new Response(
            JSON.stringify({ error: "Missing challenge parameter" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          )
        }
        
        // Verify the token matches (if configured)
        if (EXPECTED_VERIFICATION_TOKEN && verificationToken !== EXPECTED_VERIFICATION_TOKEN) {
          console.warn("Invalid verification token received", { 
            expected: EXPECTED_VERIFICATION_TOKEN ? "***" : "not set",
            received: verificationToken ? "***" : "missing"
          })
          return new Response(
            "Invalid verification token",
            { status: 401 }
          )
        }
        
        console.log("Webhook verification successful, returning challenge")
        // Return the challenge as required by Oura
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
        console.error("Error handling GET request:", getError)
        return new Response(
          JSON.stringify({ error: "Error processing verification request", message: getError.message }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    // Handle POST request for webhook events
    const body = await req.json()

    // Handle webhook event (Step 4 in Oura docs)
    const event: WebhookEvent = body

    if (!event.event_type || !event.data_type || !event.object_id || !event.user_id) {
      return new Response(
        JSON.stringify({ error: "Invalid webhook event" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log("Webhook event received:", {
      event_type: event.event_type,
      data_type: event.data_type,
      object_id: event.object_id,
      user_id: event.user_id,
      event_time: event.event_time,
    })

    // TODO: Retrieve user's Oura access token from Keychain (stored in iOS app)
    // For now, we'll log the event and return success quickly
    // The iOS app can fetch the full data later using the object_id
    
    // Note: We should verify the x-oura-signature header for security
    // const signature = req.headers.get("x-oura-signature")
    // const timestamp = req.headers.get("x-oura-timestamp")
    // Verify signature using HMAC with client secret

    // Return success to Oura
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
    console.error("Webhook error:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})

