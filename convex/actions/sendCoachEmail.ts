"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

// MARK: - Types

interface TokenExchangeResult {
  access_token: string;
  refresh_token?: string;
}

// MARK: - Helpers

function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  }
  return csvRows.join("\n");
}

async function exchangeOuraRefreshToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenExchangeResult | null> {
  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken.trim(),
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function exchangeWhoopRefreshToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenExchangeResult | null> {
  try {
    const params = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken.trim(),
      client_id: clientId,
      client_secret: clientSecret,
      scope: "offline",
    });

    const response = await fetch("https://api.prod.whoop.com/oauth/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function fetchOuraData(accessToken: string, startDate: string, endDate: string): Promise<string> {
  const fetchEndpoint = async (endpoint: string): Promise<string> => {
    try {
      const url = `https://api.ouraring.com/v2/usercollection/${endpoint}?start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) return "";
      const json = await res.json();
      const data = json.data || [];
      return data.length > 0 ? convertToCSV(data) : "";
    } catch {
      return "";
    }
  };

  const [sleepData, activityData, readinessData] = await Promise.all([
    fetchEndpoint("sleep"),
    fetchEndpoint("daily_activity"),
    fetchEndpoint("daily_readiness"),
  ]);

  let csv = "=== SLEEP DATA ===\n";
  csv += sleepData || "No data for this period\n";
  csv += "\n\n=== ACTIVITY DATA ===\n";
  csv += activityData || "No data for this period\n";
  csv += "\n\n=== READINESS DATA ===\n";
  csv += readinessData || "No data for this period\n";
  return csv;
}

async function fetchWhoopData(accessToken: string, startDate: string, endDate: string): Promise<string> {
  const startISO = new Date(startDate).toISOString();
  const endISO = new Date(endDate).toISOString();

  const fetchEndpoint = async (endpoint: string): Promise<string> => {
    try {
      let url: string;
      if (endpoint === "recovery") {
        url = `https://api.prod.whoop.com/developer/v2/recovery?start=${startISO}&end=${endISO}`;
      } else if (endpoint === "sleep") {
        url = `https://api.prod.whoop.com/developer/v2/activity/sleep?start=${startISO}&end=${endISO}`;
      } else {
        url = `https://api.prod.whoop.com/developer/v2/cycle?start=${startISO}&end=${endISO}`;
      }
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) return "";
      const json = await res.json();
      const data = Array.isArray(json) ? json : (json.records || json.data || []);
      return data.length > 0 ? convertToCSV(data) : "";
    } catch {
      return "";
    }
  };

  const [recoveryData, sleepData, cycleData] = await Promise.all([
    fetchEndpoint("recovery"),
    fetchEndpoint("sleep"),
    fetchEndpoint("cycle"),
  ]);

  let csv = "=== RECOVERY DATA ===\n";
  csv += recoveryData || "No data for this period\n";
  csv += "\n\n=== SLEEP DATA ===\n";
  csv += sleepData || "No data for this period\n";
  csv += "\n\n=== CYCLE DATA ===\n";
  csv += cycleData || "No data for this period\n";
  return csv;
}

async function sendEmail(
  resendApiKey: string,
  coachEmail: string,
  userName: string,
  dateRange: string,
  csvData: string,
  hasOuraData: boolean,
  hasWhoopData: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const wearableParts: string[] = [];
    if (hasOuraData) wearableParts.push("Oura data (sleep, activity, readiness)");
    if (hasWhoopData) wearableParts.push("WHOOP data (recovery, sleep, cycle)");
    const wearableText = wearableParts.length > 0 ? `, and ${wearableParts.join(", ")}` : "";

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
    `;

    const csvBytes = new TextEncoder().encode(csvData);
    const csvBase64 = btoa(String.fromCharCode(...csvBytes));

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Forge <maddisen@meetcal.app>",
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
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Resend API error: ${response.status} - ${errorData}`);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// MARK: - Main Action

export const run = internalAction({
  args: {},
  handler: async (ctx): Promise<{ message: string; total?: number; successful?: number; failed?: number }> => {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const ouraClientId = process.env.OURA_CLIENT_ID ?? "";
    const ouraClientSecret = process.env.OURA_CLIENT_SECRET ?? "";
    const whoopClientId = process.env.WHOOP_CLIENT_ID ?? "";
    const whoopClientSecret = process.env.WHOOP_CLIENT_SECRET ?? "";

    // Fetch users with a coach email set and storeToken enabled
    const users = await ctx.runQuery(internal.users.getUsersWithCoachEmail, {});

    if (users.length === 0) {
      console.log("No users with coach emails found");
      return { message: "No users with coach emails found" };
    }

    console.log(`Processing ${users.length} users with coach emails`);

    // Calculate date range (past 7 days)
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const formatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
    const dateRange = `${formatter.format(sevenDaysAgo)} - ${formatter.format(today)}`;
    const startDateStr = sevenDaysAgo.toISOString().split("T")[0]!;
    const endDateStr = today.toISOString().split("T")[0]!;

    const results: Array<{ userId: string; coachEmail: string; success: boolean; error?: string }> = [];

    for (const user of users) {
      if (!user.coachEmail) continue;

      try {
        console.log(`Processing user: ${user.userId}`);

        // Fetch weekly journal data from Convex
        const [checkIns, compReports, sessionReports] = await Promise.all([
          ctx.runQuery(internal.dailyCheckIns.listWeekly, { userId: user.userId, since: startDateStr }),
          ctx.runQuery(internal.compReports.listWeekly, { userId: user.userId, since: startDateStr }),
          ctx.runQuery(internal.sessionReports.listWeekly, { userId: user.userId, since: startDateStr }),
        ]);

        if (checkIns.length === 0 && compReports.length === 0 && sessionReports.length === 0) {
          console.log(`Skipping user ${user.userId}: no data for this week`);
          results.push({ userId: user.userId, coachEmail: user.coachEmail, success: false, error: "No data to send" });
          continue;
        }

        let combinedCSV = "=== DAILY CHECK-INS ===\n";
        combinedCSV += checkIns.length > 0 ? convertToCSV(checkIns as Record<string, unknown>[]) : "No data for this period\n";
        combinedCSV += "\n\n=== COMPETITION REPORTS ===\n";
        combinedCSV += compReports.length > 0 ? convertToCSV(compReports as Record<string, unknown>[]) : "No data for this period\n";
        combinedCSV += "\n\n=== SESSION REPORTS ===\n";
        combinedCSV += sessionReports.length > 0 ? convertToCSV(sessionReports as Record<string, unknown>[]) : "No data for this period\n";

        // Fetch Oura wearable data if stored
        let ouraCSV = "";
        if (user.storeToken && user.ouraRefreshToken) {
          const tokenResult = await exchangeOuraRefreshToken(user.ouraRefreshToken, ouraClientId, ouraClientSecret);
          if (tokenResult?.access_token) {
            ouraCSV = await fetchOuraData(tokenResult.access_token, startDateStr, endDateStr);
            // Persist updated refresh token if Oura rotated it
            if (tokenResult.refresh_token && tokenResult.refresh_token !== user.ouraRefreshToken) {
              await ctx.runMutation(internal.users.patchOuraToken, {
                userId: user.userId,
                ouraRefreshToken: tokenResult.refresh_token,
              });
            }
          } else {
            // Invalid token — clear it so we don't keep retrying
            await ctx.runMutation(internal.users.patchOuraToken, {
              userId: user.userId,
              ouraRefreshToken: undefined,
            });
          }
        }

        // Fetch WHOOP wearable data if stored
        let whoopCSV = "";
        if (user.storeToken && user.whoopRefreshToken) {
          const tokenResult = await exchangeWhoopRefreshToken(user.whoopRefreshToken, whoopClientId, whoopClientSecret);
          if (tokenResult?.access_token) {
            whoopCSV = await fetchWhoopData(tokenResult.access_token, startDateStr, endDateStr);
            if (tokenResult.refresh_token && tokenResult.refresh_token !== user.whoopRefreshToken) {
              await ctx.runMutation(internal.users.patchWhoopToken, {
                userId: user.userId,
                whoopRefreshToken: tokenResult.refresh_token,
              });
            }
          } else {
            await ctx.runMutation(internal.users.patchWhoopToken, {
              userId: user.userId,
              whoopRefreshToken: undefined,
            });
          }
        }

        if (ouraCSV) {
          combinedCSV += "\n\n=== OURA DATA ===\n";
          combinedCSV += ouraCSV;
        }

        if (whoopCSV) {
          combinedCSV += "\n\n=== WHOOP DATA ===\n";
          combinedCSV += whoopCSV;
        }

        const emailResult = await sendEmail(
          resendApiKey,
          user.coachEmail,
          `${user.firstName} ${user.lastName}`,
          dateRange,
          combinedCSV,
          ouraCSV.length > 0,
          whoopCSV.length > 0
        );

        results.push({ userId: user.userId, coachEmail: user.coachEmail, ...emailResult });
        console.log(`Email ${emailResult.success ? "sent" : "failed"} for user ${user.userId}`);
      } catch (error) {
        console.error(`Error processing user ${user.userId}:`, error);
        results.push({
          userId: user.userId,
          coachEmail: user.coachEmail,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return {
      message: "Weekly coach emails processed",
      total: users.length,
      successful: successCount,
      failed: results.length - successCount,
    };
  },
});
