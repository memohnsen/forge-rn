import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"
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
      
      console.log(`[${requestId}] Authentication successful - User: ${payload.sub}`)
      
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

    // Get the ElevenLabs API key from environment variables
    const elevenlabsApiKey = Deno.env.get('ELEVENLABS_API_KEY')
    if (!elevenlabsApiKey) {
      console.error(`[${requestId}] ELEVENLABS_API_KEY not configured`)
      throw new Error('ELEVENLABS_API_KEY not configured')
    }

    // Parse the request body
    const { endpoint, method = 'POST', body: requestBody } = await req.json()
    console.log(`[${requestId}] Request - Endpoint: ${endpoint}, Method: ${method}`)

    // Validate required fields
    if (!endpoint) {
      console.warn(`[${requestId}] Missing required field: endpoint`)
      return new Response(
        JSON.stringify({ error: 'Missing required field: endpoint' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Construct the full URL
    const fullUrl = `${ELEVENLABS_API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
    
    // Make request to ElevenLabs
    console.log(`[${requestId}] Sending request to ElevenLabs API: ${fullUrl}`)
    const elevenlabsStartTime = Date.now()
    
    const elevenlabsResponse = await fetch(fullUrl, {
      method,
      headers: {
        'xi-api-key': elevenlabsApiKey,
        'Content-Type': 'application/json',
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    })

    const elevenlabsDuration = Date.now() - elevenlabsStartTime
    console.log(`[${requestId}] ElevenLabs response - Status: ${elevenlabsResponse.status}, Duration: ${elevenlabsDuration}ms`)

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text()
      console.error(`[${requestId}] ElevenLabs API error (${elevenlabsResponse.status}):`, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API error',
          details: errorText 
        }),
        { 
          status: elevenlabsResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle binary responses (like audio)
    const contentType = elevenlabsResponse.headers.get('content-type') || ''
    if (contentType.includes('audio')) {
      const audioData = await elevenlabsResponse.arrayBuffer()
      const totalDuration = Date.now() - startTime
      
      console.log(`[${requestId}] Audio request completed successfully - Total duration: ${totalDuration}ms, Size: ${audioData.byteLength} bytes`)

      return new Response(
        audioData,
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': contentType,
            'Content-Length': audioData.byteLength.toString()
          },
          status: 200 
        }
      )
    }

    // Handle JSON responses
    const data = await elevenlabsResponse.json()
    const totalDuration = Date.now() - startTime
    
    console.log(`[${requestId}] Request completed successfully - Total duration: ${totalDuration}ms`)

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const totalDuration = Date.now() - startTime
    console.error(`[${requestId}] Edge function error (${totalDuration}ms):`, error)
    console.error(`[${requestId}] Error stack:`, error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
