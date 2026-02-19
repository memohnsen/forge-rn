/**
 * Migration parity check script
 *
 * Queries both Supabase and Convex, compares row counts for all 5 tables.
 *
 * Usage:
 *   bun run verify-migration
 *
 * Required env vars (in .env):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   EXPO_PUBLIC_CONVEX_URL
 */

import { config } from "dotenv";
config(); // load .env
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;

if (!supabaseUrl || !supabaseKey || !convexUrl) {
  console.error(
    "Missing required env vars: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EXPO_PUBLIC_CONVEX_URL"
  );
  process.exit(1);
}

const convex = new ConvexHttpClient(convexUrl);

const supabaseHeaders = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  "Content-Type": "application/json",
  Prefer: "count=exact",
};

async function getSupabaseCount(table: string): Promise<number> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/${table}?select=id&limit=1`,
    { headers: supabaseHeaders }
  );
  const countHeader = res.headers.get("content-range");
  if (!countHeader) throw new Error(`No content-range header for ${table}`);
  return parseInt(countHeader.split("/")[1], 10);
}

async function getSupabaseSample(
  table: string,
  limit = 5
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/${table}?select=*&limit=${limit}&order=id.asc`,
    { headers: { ...supabaseHeaders, Prefer: "" } }
  );
  return res.json();
}

async function getConvexCount(
  queryFn: (userId: string) => Promise<unknown[]>,
  allUserIds: string[]
): Promise<number> {
  let total = 0;
  for (const userId of allUserIds) {
    const rows = await queryFn(userId);
    total += rows.length;
  }
  return total;
}

function ok(msg: string) {
  console.log(`  ✓ ${msg}`);
}
function fail(msg: string) {
  console.error(`  ✗ ${msg}`);
}

async function checkTable(
  label: string,
  supabaseTable: string,
  getConvexRows: (userId: string) => Promise<unknown[]>,
  allUserIds: string[]
) {
  console.log(`\n[${label}]`);

  const sbCount = await getSupabaseCount(supabaseTable);
  const cvxCount = await getConvexCount(getConvexRows, allUserIds);

  if (sbCount === cvxCount) {
    ok(`Row counts match: ${sbCount}`);
  } else {
    fail(`Row count mismatch: Supabase=${sbCount} vs Convex=${cvxCount}`);
  }

  const sample = await getSupabaseSample(supabaseTable);
  console.log(`  Sample (first ${sample.length} rows by Supabase id):`);
  sample.forEach((row) => {
    console.log(`    id=${row.id} user_id=${row.user_id}`);
  });
}

async function main() {
  console.log("=== Migration Parity Check ===");
  console.log(`Supabase: ${supabaseUrl}`);
  console.log(`Convex:   ${convexUrl}\n`);

  // Get all user IDs from Supabase
  const usersRes = await fetch(
    `${supabaseUrl}/rest/v1/journal_users?select=user_id`,
    { headers: { ...supabaseHeaders, Prefer: "" } }
  );
  const usersData: { user_id: string }[] = await usersRes.json();
  const allUserIds = usersData.map((u) => u.user_id);
  console.log(`Found ${allUserIds.length} users in Supabase`);

  // Users
  const sbUserCount = await getSupabaseCount("journal_users");
  const cvxUserCount = (await Promise.all(
    allUserIds.map((uid) =>
      convex.query(api.users.getByUserId, { userId: uid }).then((u) => (u ? 1 : 0))
    )
  )).reduce((a, b) => a + b, 0);

  console.log("\n[users]");
  if (sbUserCount === cvxUserCount) {
    ok(`Row counts match: ${sbUserCount}`);
  } else {
    fail(`Row count mismatch: Supabase=${sbUserCount} vs Convex=${cvxUserCount}`);
  }

  await checkTable(
    "dailyCheckIns",
    "journal_daily_checkins",
    (uid) => convex.query(api.dailyCheckIns.listByUser, { userId: uid }),
    allUserIds
  );

  await checkTable(
    "sessionReports",
    "journal_session_report",
    (uid) => convex.query(api.sessionReports.listByUser, { userId: uid }),
    allUserIds
  );

  await checkTable(
    "compReports",
    "journal_comp_report",
    (uid) => convex.query(api.compReports.listByUser, { userId: uid }),
    allUserIds
  );

  await checkTable(
    "objectiveReviews",
    "journal_objective_review",
    (uid) => convex.query(api.objectiveReviews.listByUser, { userId: uid }),
    allUserIds
  );

  console.log("\n=== Done ===");
}

main().catch((e) => {
  console.error("Parity check failed:", e);
  process.exit(1);
});
