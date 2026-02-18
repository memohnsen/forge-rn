// Supabase Edge Function: send-coach-email
// Runs on cron schedule (every Sunday at 9:00 AM)
// Sends weekly performance reports to coaches via Resend

import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const OURA_CLIENT_ID = Deno.env.get("OURA_CLIENT_ID")!
const OURA_CLIENT_SECRET = Deno.env.get("OURA_CLIENT_SECRET")!
const WHOOP_CLIENT_ID = Deno.env.get("WHOOP_CLIENT_ID")!
const WHOOP_CLIENT_SECRET = Deno.env.get("WHOOP_CLIENT_SECRET")!

interface User {
  user_id: string
  first_name: string
  last_name: string
  coach_email: string
  oura_refresh_token?: string | null
  whoop_refresh_token?: string | null
  store_token?: boolean | null
}

interface EmailResult {
  userId: string
  coachEmail: string
  success: boolean
  error?: string
}

serve(async (req) => {
  try {
    // Initialize Supabase client with service role key for cron jobs
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Verify Resend API key is configured
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured")
    }

    // Query all users with coach_email set
    const { data: users, error: usersError } = await supabase
      .from("journal_users")
      .select("user_id, first_name, last_name, coach_email, oura_refresh_token, whoop_refresh_token, store_token")
      .not("coach_email", "is", null)
      .neq("coach_email", "")

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users with coach emails found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    console.log(`Processing ${users.length} users with coach emails`)

    // Calculate date range (past 7 days)
    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    const startDate = dateFormatter.format(sevenDaysAgo)
    const endDate = dateFormatter.format(today)
    const dateRange = `${startDate} - ${endDate}`

    const dateString = sevenDaysAgo.toISOString().split("T")[0] // YYYY-MM-DD format

    // Process each user
    const results: EmailResult[] = []

    for (const user of users as User[]) {
      try {
        console.log(`Processing user: ${user.user_id}`)

        // Fetch weekly data from all three main tables
        const [checkInsData, compReportsData, sessionReportsData] = await Promise.all([
          fetchWeeklyCheckins(supabase, user.user_id, dateString),
          fetchWeeklyCompReports(supabase, user.user_id, dateString),
          fetchWeeklySessionReports(supabase, user.user_id, dateString),
        ])

        // Check if at least one main data source has data
        const hasCheckIns = checkInsData && checkInsData.length > 0
        const hasCompReports = compReportsData && compReportsData.length > 0
        const hasSessionReports = sessionReportsData && sessionReportsData.length > 0
        
        if (!hasCheckIns && !hasCompReports && !hasSessionReports) {
          console.log(`Skipping user ${user.user_id}: No main data sources have data`)
          results.push({
            userId: user.user_id,
            coachEmail: user.coach_email,
            success: false,
            error: "No data to send",
          })
          continue
        }

        // Combine CSV data from main sources
        let combinedCSV = "=== DAILY CHECK-INS ===\n"
        combinedCSV += checkInsData || "No data for this period\n"
        combinedCSV += "\n\n=== COMPETITION REPORTS ===\n"
        combinedCSV += compReportsData || "No data for this period\n"
        combinedCSV += "\n\n=== SESSION REPORTS ===\n"
        combinedCSV += sessionReportsData || "No data for this period\n"

        // Fetch Oura data if user has stored token enabled
        let ouraData = ""
        if (user.store_token && user.oura_refresh_token) {
          try {
            const tokenResult = await exchangeOuraRefreshTokenForAccessToken(
              user.oura_refresh_token,
              user.user_id,
              supabase
            )
            if (tokenResult?.accessToken) {
              const endDateString = today.toISOString().split("T")[0]
              ouraData = await fetchOuraData(tokenResult.accessToken, dateString, endDateString)
              
              // If Oura returned a new refresh token, update it in the database
              if (tokenResult.newRefreshToken && tokenResult.newRefreshToken !== user.oura_refresh_token) {
                const { error: updateError } = await supabase
                  .from("journal_users")
                  .update({ oura_refresh_token: tokenResult.newRefreshToken })
                  .eq("user_id", user.user_id)
                
                if (updateError) {
                  console.error(`Error updating refresh token for user ${user.user_id}:`, updateError)
                } else {
                  console.log(`Updated refresh token for user ${user.user_id}`)
                }
              }
            } else {
              // Token exchange failed - refresh token might be invalid
              // Clear it from database so we don't keep trying with a bad token
              console.log(`Token exchange failed for user ${user.user_id}, clearing invalid refresh token`)
              const { error: clearError } = await supabase
                .from("journal_users")
                .update({ oura_refresh_token: null })
                .eq("user_id", user.user_id)
              
              if (clearError) {
                console.error(`Error clearing refresh token for user ${user.user_id}:`, clearError)
              }
            }
          } catch (error) {
            console.error(`Error fetching Oura data for user ${user.user_id}:`, error)
            ouraData = "Error fetching Oura data\n"
          }
        }

        // Fetch WHOOP data if user has stored token enabled
        let whoopData = ""
        if (user.store_token && user.whoop_refresh_token) {
          console.log(`🔍 [WHOOP] Checking WHOOP data for user ${user.user_id}`)
          console.log(`🔍 [WHOOP] store_token: ${user.store_token}, has_refresh_token: ${!!user.whoop_refresh_token}`)
          console.log(`🔍 [WHOOP] Refresh token length: ${user.whoop_refresh_token.length}`)
          
          try {
            console.log(`🔄 [WHOOP] Attempting to exchange refresh token for user ${user.user_id}`)
            const tokenResult = await exchangeWhoopRefreshTokenForAccessToken(
              user.whoop_refresh_token,
              user.user_id,
              supabase
            )
            
            if (tokenResult?.accessToken) {
              console.log(`✅ [WHOOP] Token exchange successful for user ${user.user_id}`)
              console.log(`✅ [WHOOP] Access token length: ${tokenResult.accessToken.length}`)
              console.log(`✅ [WHOOP] Has new refresh token: ${!!tokenResult.newRefreshToken}`)
              
              const endDateString = today.toISOString().split("T")[0]
              console.log(`📊 [WHOOP] Fetching WHOOP data for date range: ${dateString} to ${endDateString}`)
              
              whoopData = await fetchWhoopData(tokenResult.accessToken, dateString, endDateString)
              
              // Log data fetch results
              if (whoopData && whoopData.length > 0) {
                const dataLines = whoopData.split('\n').filter(line => line.trim().length > 0)
                const hasRecoveryData = whoopData.includes('=== RECOVERY DATA ===')
                const hasSleepData = whoopData.includes('=== SLEEP DATA ===')
                const hasCycleData = whoopData.includes('=== CYCLE DATA ===')
                
                console.log(`✅ [WHOOP] Successfully fetched WHOOP data for user ${user.user_id}`)
                console.log(`📊 [WHOOP] Total CSV length: ${whoopData.length} characters`)
                console.log(`📊 [WHOOP] Has recovery data: ${hasRecoveryData}`)
                console.log(`📊 [WHOOP] Has sleep data: ${hasSleepData}`)
                console.log(`📊 [WHOOP] Has cycle data: ${hasCycleData}`)
                console.log(`📊 [WHOOP] Total data lines: ${dataLines.length}`)
              } else {
                console.log(`⚠️ [WHOOP] No WHOOP data returned for user ${user.user_id} (empty response)`)
                console.log(`⚠️ [WHOOP] This could mean: no data for date range, or API returned empty results`)
              }
              
              // If WHOOP returned a new refresh token, update it in the database
              if (tokenResult.newRefreshToken && tokenResult.newRefreshToken !== user.whoop_refresh_token) {
                console.log(`🔄 [WHOOP] New refresh token received, updating database for user ${user.user_id}`)
                const { error: updateError } = await supabase
                  .from("journal_users")
                  .update({ whoop_refresh_token: tokenResult.newRefreshToken })
                  .eq("user_id", user.user_id)
                
                if (updateError) {
                  console.error(`❌ [WHOOP] Error updating refresh token for user ${user.user_id}:`, updateError)
                } else {
                  console.log(`✅ [WHOOP] Successfully updated refresh token for user ${user.user_id}`)
                }
              } else {
                console.log(`ℹ️ [WHOOP] No new refresh token provided (using existing token)`)
              }
            } else {
              // Token exchange failed - refresh token might be invalid
              console.error(`❌ [WHOOP] Token exchange failed for user ${user.user_id}`)
              console.error(`❌ [WHOOP] No access token returned - refresh token may be invalid or expired`)
              console.log(`🗑️ [WHOOP] Clearing invalid refresh token from database for user ${user.user_id}`)
              
              const { error: clearError } = await supabase
                .from("journal_users")
                .update({ whoop_refresh_token: null })
                .eq("user_id", user.user_id)
              
              if (clearError) {
                console.error(`❌ [WHOOP] Error clearing refresh token for user ${user.user_id}:`, clearError)
              } else {
                console.log(`✅ [WHOOP] Successfully cleared invalid refresh token for user ${user.user_id}`)
              }
            }
          } catch (error) {
            console.error(`❌ [WHOOP] Error fetching WHOOP data for user ${user.user_id}:`, error)
            console.error(`❌ [WHOOP] Error details:`, error instanceof Error ? error.message : String(error))
            if (error instanceof Error && error.stack) {
              console.error(`❌ [WHOOP] Error stack:`, error.stack)
            }
            whoopData = "Error fetching WHOOP data\n"
          }
        } else {
          if (!user.store_token) {
            console.log(`ℹ️ [WHOOP] Skipping WHOOP data for user ${user.user_id} - store_token is false`)
          } else if (!user.whoop_refresh_token) {
            console.log(`ℹ️ [WHOOP] Skipping WHOOP data for user ${user.user_id} - no refresh token stored`)
          }
        }

        // Append Oura data if available
        if (ouraData) {
          combinedCSV += "\n\n=== OURA DATA ===\n"
          combinedCSV += ouraData || "No data for this period\n"
        }

        // Append WHOOP data if available
        if (whoopData) {
          console.log(`✅ [WHOOP] Adding WHOOP data to email for user ${user.user_id}`)
          console.log(`📊 [WHOOP] WHOOP data length: ${whoopData.length} characters`)
          combinedCSV += "\n\n=== WHOOP DATA ===\n"
          combinedCSV += whoopData || "No data for this period\n"
        } else {
          console.log(`ℹ️ [WHOOP] No WHOOP data to add for user ${user.user_id}`)
        }

        // Send email via Resend
        const hasOuraData = ouraData && ouraData.length > 0
        const hasWhoopData = whoopData && whoopData.length > 0
        const emailResult = await sendEmailViaResend(
          user.coach_email,
          `${user.first_name} ${user.last_name}`,
          dateRange,
          combinedCSV,
          hasOuraData,
          hasWhoopData
        )

        results.push({
          userId: user.user_id,
          coachEmail: user.coach_email,
          success: emailResult.success,
          error: emailResult.error,
        })

        console.log(
          `Email ${emailResult.success ? "sent" : "failed"} for user ${user.user_id}`
        )
      } catch (error) {
        console.error(`Error processing user ${user.user_id}:`, error)
        results.push({
          userId: user.user_id,
          coachEmail: user.coach_email,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Return summary
    const successCount = results.filter((r) => r.success).length
    const failureCount = results.filter((r) => !r.success).length

    return new Response(
      JSON.stringify({
        message: "Weekly coach emails processed",
        total: users.length,
        successful: successCount,
        failed: failureCount,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Error in send-coach-email function:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
})

// Helper function to fetch weekly check-ins
async function fetchWeeklyCheckins(
  supabase: any,
  userId: string,
  dateString: string
): Promise<string> {
  const { data, error } = await supabase
    .from("journal_daily_checkins")
    .select("*")
    .eq("user_id", userId)
    .gte("check_in_date", dateString)
    .order("check_in_date", { ascending: false })

  if (error) {
    console.error(`Error fetching check-ins for user ${userId}:`, error)
    return ""
  }

  if (!data || data.length === 0) {
    return ""
  }

  // Convert to CSV format
  return convertToCSV(data)
}

// Helper function to fetch weekly comp reports
async function fetchWeeklyCompReports(
  supabase: any,
  userId: string,
  dateString: string
): Promise<string> {
  const { data, error } = await supabase
    .from("journal_comp_report")
    .select("*")
    .eq("user_id", userId)
    .gte("meet_date", dateString)
    .order("meet_date", { ascending: false })

  if (error) {
    console.error(`Error fetching comp reports for user ${userId}:`, error)
    return ""
  }

  if (!data || data.length === 0) {
    return ""
  }

  return convertToCSV(data)
}

// Helper function to fetch weekly session reports
async function fetchWeeklySessionReports(
  supabase: any,
  userId: string,
  dateString: string
): Promise<string> {
  const { data, error } = await supabase
    .from("journal_session_report")
    .select("*")
    .eq("user_id", userId)
    .gte("session_date", dateString)
    .order("session_date", { ascending: false })

  if (error) {
    console.error(`Error fetching session reports for user ${userId}:`, error)
    return ""
  }

  if (!data || data.length === 0) {
    return ""
  }

  return convertToCSV(data)
}

// Helper function to exchange refresh token for access token
// Returns both access token and new refresh token (if provided by Oura)
async function exchangeOuraRefreshTokenForAccessToken(
  refreshToken: string,
  userId: string,
  supabase: any
): Promise<{ accessToken: string; newRefreshToken?: string } | null> {
  try {
    // Verify environment variables are set
    if (!OURA_CLIENT_ID || !OURA_CLIENT_SECRET) {
      console.error("OURA_CLIENT_ID or OURA_CLIENT_SECRET not configured")
      return null
    }

    if (!refreshToken || refreshToken.trim() === "") {
      console.error("Refresh token is empty or invalid")
      return null
    }
    
    // Trim refresh token to remove any whitespace
    const trimmedRefreshToken = refreshToken.trim()
    
    // Build params - try without redirect_uri first (some OAuth providers don't require it for refresh grants)
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: trimmedRefreshToken,
      client_id: OURA_CLIENT_ID,
      client_secret: OURA_CLIENT_SECRET,
    })
    
    // Try with redirect_uri if first attempt fails (commented out for now)
    // const redirectURI = "forge://oauth/callback"
    // params.append("redirect_uri", redirectURI)
    
    console.log(`Exchanging refresh token for user ${userId} (client_id present: ${!!OURA_CLIENT_ID}, refresh_token length: ${refreshToken.length})`)
    
    const response = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Oura token exchange failed (${response.status}) for user ${userId}:`, errorText)
      
      // Try to parse error for more details
      try {
        const errorJson = JSON.parse(errorText)
        console.error(`Error details:`, JSON.stringify(errorJson, null, 2))
      } catch (e) {
        // Not JSON, just log the text
      }
      
      return null
    }

    const tokenData = await response.json()
    
    return {
      accessToken: tokenData.access_token,
      newRefreshToken: tokenData.refresh_token, // Oura may return a new refresh token
    }
  } catch (error) {
    console.error(`Error exchanging refresh token for user ${userId}:`, error)
    return null
  }
}

// Helper function to fetch Oura data (sleep, activity, readiness)
async function fetchOuraData(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<string> {
  try {
    const [sleepData, activityData, readinessData] = await Promise.all([
      fetchOuraEndpoint(accessToken, "sleep", startDate, endDate),
      fetchOuraEndpoint(accessToken, "daily_activity", startDate, endDate),
      fetchOuraEndpoint(accessToken, "daily_readiness", startDate, endDate),
    ])

    let combinedOuraCSV = "=== SLEEP DATA ===\n"
    combinedOuraCSV += sleepData || "No data for this period\n"
    combinedOuraCSV += "\n\n=== ACTIVITY DATA ===\n"
    combinedOuraCSV += activityData || "No data for this period\n"
    combinedOuraCSV += "\n\n=== READINESS DATA ===\n"
    combinedOuraCSV += readinessData || "No data for this period\n"

    return combinedOuraCSV
  } catch (error) {
    console.error("Error fetching Oura data:", error)
    return ""
  }
}

// Helper function to fetch data from a specific Oura endpoint
async function fetchOuraEndpoint(
  accessToken: string,
  endpoint: string,
  startDate: string,
  endDate: string
): Promise<string> {
  try {
    const url = `https://api.ouraring.com/v2/usercollection/${endpoint}?start_date=${startDate}&end_date=${endDate}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Oura API error for ${endpoint} (${response.status}):`, errorText)
      return ""
    }

    const responseData = await response.json()
    const data = responseData.data || []

    if (data.length === 0) {
      return ""
    }

    return convertToCSV(data)
  } catch (error) {
    console.error(`Error fetching Oura ${endpoint}:`, error)
    return ""
  }
}

// Helper function to convert data array to CSV string
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ""

  // Get headers from first object
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(",")]

  // Convert each row
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      // Handle null/undefined and escape commas/quotes
      if (value === null || value === undefined) return ""
      const stringValue = String(value)
      // Escape quotes and wrap in quotes if contains comma or quote
      if (stringValue.includes(",") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
    csvRows.push(values.join(","))
  }

    return csvRows.join("\n")
}

// Helper function to exchange WHOOP refresh token for access token
async function exchangeWhoopRefreshTokenForAccessToken(
  refreshToken: string,
  userId: string,
  supabase: any
): Promise<{ accessToken: string; newRefreshToken?: string } | null> {
  try {
    console.log(`🔄 [WHOOP Token Exchange] Starting token exchange for user ${userId}`)
    
    if (!WHOOP_CLIENT_ID || !WHOOP_CLIENT_SECRET) {
      console.error(`❌ [WHOOP Token Exchange] Missing credentials - CLIENT_ID: ${!!WHOOP_CLIENT_ID}, CLIENT_SECRET: ${!!WHOOP_CLIENT_SECRET}`)
      return null
    }

    if (!refreshToken || refreshToken.trim() === "") {
      console.error(`❌ [WHOOP Token Exchange] Refresh token is empty or invalid for user ${userId}`)
      return null
    }
    
    // Trim refresh token to remove any whitespace
    const trimmedRefreshToken = refreshToken.trim()
    console.log(`🔄 [WHOOP Token Exchange] Refresh token length: ${trimmedRefreshToken.length} characters`)
    console.log(`🔄 [WHOOP Token Exchange] Client ID present: ${!!WHOOP_CLIENT_ID}`)
    console.log(`🔄 [WHOOP Token Exchange] Client Secret present: ${!!WHOOP_CLIENT_SECRET}`)
    
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: trimmedRefreshToken,
      client_id: WHOOP_CLIENT_ID,
      client_secret: WHOOP_CLIENT_SECRET,
      scope: "offline", // Required for refresh token requests
    })
    
    const tokenURL = "https://api.prod.whoop.com/oauth/oauth2/token"
    console.log(`📤 [WHOOP Token Exchange] Sending request to: ${tokenURL}`)
    
    const response = await fetch(tokenURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    })

    console.log(`📥 [WHOOP Token Exchange] Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [WHOOP Token Exchange] Token exchange failed (${response.status}) for user ${userId}`)
      console.error(`❌ [WHOOP Token Exchange] Error response: ${errorText}`)
      return null
    }

    const tokenData = await response.json()
    console.log(`✅ [WHOOP Token Exchange] Response received - has access_token: ${!!tokenData.access_token}`)
    console.log(`✅ [WHOOP Token Exchange] Response received - has refresh_token: ${!!tokenData.refresh_token}`)
    
    if (!tokenData.access_token) {
      console.error(`❌ [WHOOP Token Exchange] Token exchange response missing access_token for user ${userId}`)
      return null
    }

    console.log(`✅ [WHOOP Token Exchange] Successfully exchanged refresh token for user ${userId}`)
    console.log(`✅ [WHOOP Token Exchange] Access token length: ${tokenData.access_token.length}`)
    if (tokenData.refresh_token) {
      console.log(`✅ [WHOOP Token Exchange] New refresh token length: ${tokenData.refresh_token.length}`)
    }
    
    return {
      accessToken: tokenData.access_token,
      newRefreshToken: tokenData.refresh_token, // WHOOP may return a new refresh token
    }
  } catch (error) {
    console.error(`❌ [WHOOP Token Exchange] Error exchanging refresh token for user ${userId}:`, error)
    if (error instanceof Error) {
      console.error(`❌ [WHOOP Token Exchange] Error message: ${error.message}`)
      if (error.stack) {
        console.error(`❌ [WHOOP Token Exchange] Error stack: ${error.stack}`)
      }
    }
    return null
  }
}

// Helper function to fetch WHOOP data (recovery, sleep, cycle)
async function fetchWhoopData(
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<string> {
  try {
    console.log(`📊 [WHOOP Data Fetch] Starting data fetch for date range: ${startDate} to ${endDate}`)
    
    // Convert date strings to ISO format for WHOOP API
    const startISO = new Date(startDate).toISOString()
    const endISO = new Date(endDate).toISOString()
    
    console.log(`📊 [WHOOP Data Fetch] ISO date range: ${startISO} to ${endISO}`)
    console.log(`📊 [WHOOP Data Fetch] Fetching recovery, sleep, and cycle data in parallel...`)
    
    const [recoveryData, sleepData, cycleData] = await Promise.all([
      fetchWhoopEndpoint(accessToken, "recovery", startISO, endISO),
      fetchWhoopEndpoint(accessToken, "sleep", startISO, endISO),
      fetchWhoopEndpoint(accessToken, "cycle", startISO, endISO),
    ])

    console.log(`📊 [WHOOP Data Fetch] Recovery data length: ${recoveryData?.length || 0} characters`)
    console.log(`📊 [WHOOP Data Fetch] Sleep data length: ${sleepData?.length || 0} characters`)
    console.log(`📊 [WHOOP Data Fetch] Cycle data length: ${cycleData?.length || 0} characters`)

    let combinedWhoopCSV = "=== RECOVERY DATA ===\n"
    combinedWhoopCSV += recoveryData || "No data for this period\n"
    combinedWhoopCSV += "\n\n=== SLEEP DATA ===\n"
    combinedWhoopCSV += sleepData || "No data for this period\n"
    combinedWhoopCSV += "\n\n=== CYCLE DATA ===\n"
    combinedWhoopCSV += cycleData || "No data for this period\n"

    const totalLength = combinedWhoopCSV.length
    console.log(`✅ [WHOOP Data Fetch] Combined CSV created - total length: ${totalLength} characters`)
    
    return combinedWhoopCSV
  } catch (error) {
    console.error(`❌ [WHOOP Data Fetch] Error fetching WHOOP data:`, error)
    if (error instanceof Error) {
      console.error(`❌ [WHOOP Data Fetch] Error message: ${error.message}`)
      if (error.stack) {
        console.error(`❌ [WHOOP Data Fetch] Error stack: ${error.stack}`)
      }
    }
    return ""
  }
}

// Helper function to fetch data from a specific WHOOP endpoint
async function fetchWhoopEndpoint(
  accessToken: string,
  endpoint: string,
  startDate: string,
  endDate: string
): Promise<string> {
  try {
    console.log(`📡 [WHOOP ${endpoint}] Fetching ${endpoint} data from WHOOP API`)
    
    let url: string
    if (endpoint === "recovery") {
      url = `https://api.prod.whoop.com/developer/v2/recovery?start=${startDate}&end=${endDate}`
    } else if (endpoint === "sleep") {
      url = `https://api.prod.whoop.com/developer/v2/activity/sleep?start=${startDate}&end=${endDate}`
    } else if (endpoint === "cycle") {
      url = `https://api.prod.whoop.com/developer/v2/cycle?start=${startDate}&end=${endDate}`
    } else {
      console.error(`❌ [WHOOP ${endpoint}] Unknown WHOOP endpoint: ${endpoint}`)
      return ""
    }
    
    console.log(`📤 [WHOOP ${endpoint}] Request URL: ${url}`)
    console.log(`📤 [WHOOP ${endpoint}] Access token length: ${accessToken.length}`)
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    console.log(`📥 [WHOOP ${endpoint}] Response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [WHOOP ${endpoint}] API error (${response.status}):`, errorText)
      return ""
    }

    const responseData = await response.json()
    console.log(`📥 [WHOOP ${endpoint}] Response received - is array: ${Array.isArray(responseData)}`)
    console.log(`📥 [WHOOP ${endpoint}] Response has records: ${!!responseData.records}`)
    console.log(`📥 [WHOOP ${endpoint}] Response has data: ${!!responseData.data}`)
    
    // WHOOP API may return data directly as array or wrapped
    const data = Array.isArray(responseData) ? responseData : (responseData.records || responseData.data || [])

    console.log(`📊 [WHOOP ${endpoint}] Parsed ${data.length} records`)

    if (data.length === 0) {
      console.log(`⚠️ [WHOOP ${endpoint}] No data returned for this date range`)
      return ""
    }

    const csvData = convertToCSV(data)
    console.log(`✅ [WHOOP ${endpoint}] Converted to CSV - length: ${csvData.length} characters`)
    
    return csvData
  } catch (error) {
    console.error(`❌ [WHOOP ${endpoint}] Error fetching data:`, error)
    if (error instanceof Error) {
      console.error(`❌ [WHOOP ${endpoint}] Error message: ${error.message}`)
      if (error.stack) {
        console.error(`❌ [WHOOP ${endpoint}] Error stack: ${error.stack}`)
      }
    }
    return ""
  }
}

// Helper function to send email via Resend
async function sendEmailViaResend(
  coachEmail: string,
  userName: string,
  dateRange: string,
  csvData: string,
  hasOuraData: boolean = false,
  hasWhoopData: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const wearableData = []
    if (hasOuraData) wearableData.push("Oura data (sleep, activity, readiness)")
    if (hasWhoopData) wearableData.push("WHOOP data (recovery, sleep, cycle)")
    
    const wearableText = wearableData.length > 0 ? `, and ${wearableData.join(", ")}` : ""
    
    const emailBody = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Weekly Performance Report</h2>
          <p>Hello,</p>
          <p>This is the weekly performance report for <strong>${userName}</strong> covering the period: <strong>${dateRange}</strong>.</p>
          <p>The report includes data from daily check-ins, competition reports, and session reports${wearableText}.</p>
          <p>Please find the detailed data attached as a CSV file.</p>
          <hr>
          <p style="color: #666; font-size: 0.9em;">
            This is an automated email from Forge - Performance Journal.<br>
            If you have any questions, please contact the athlete directly.
          </p>
        </body>
      </html>
    `

    // Convert CSV to base64 for attachment
    const csvBytes = new TextEncoder().encode(csvData)
    const csvBase64 = base64Encode(csvBytes)

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Forge <maddisen@meetcal.app>", // Update with your verified domain in Resend
        to: [coachEmail],
        subject: `Weekly Performance Report - ${userName}`,
        html: emailBody,
        attachments: [
          {
            filename: `performance-report-${new Date().toISOString().split("T")[0]}.csv`,
            content: csvBase64,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Resend API error: ${response.status} - ${errorData}`)
    }

    const result = await response.json()
    console.log(`Email sent successfully via Resend: ${result.id}`)

    return { success: true }
  } catch (error) {
    console.error("Error sending email via Resend:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

