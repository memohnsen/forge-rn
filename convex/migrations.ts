// Temporary migration utilities — delete this file after migration is complete.
import { internalMutation } from "./_generated/server";

export const clearDailyCheckIns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("dailyCheckIns").collect();
    await Promise.all(all.map((doc) => ctx.db.delete(doc._id)));
    return { deleted: all.length };
  },
});

export const clearSessionReports = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("sessionReports").collect();
    await Promise.all(all.map((doc) => ctx.db.delete(doc._id)));
    return { deleted: all.length };
  },
});

export const clearObjectiveReviews = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("objectiveReviews").collect();
    await Promise.all(all.map((doc) => ctx.db.delete(doc._id)));
    return { deleted: all.length };
  },
});
