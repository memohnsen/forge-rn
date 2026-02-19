"use node";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";

export const fetchAllForExport = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }): Promise<{ checkIns: unknown[]; sessionReports: unknown[]; compReports: unknown[] }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const [checkIns, sessionReports, compReports] = await Promise.all([
      ctx.runQuery(api.dailyCheckIns.listByUser, { userId }),
      ctx.runQuery(api.sessionReports.listByUser, { userId }),
      ctx.runQuery(api.compReports.listByUser, { userId }),
    ]);

    return { checkIns, sessionReports, compReports };
  },
});
