import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

const checkInFields = {
  userId: v.string(),
  checkInDate: v.string(),
  selectedLift: v.string(),
  selectedIntensity: v.string(),
  goal: v.string(),
  physicalStrength: v.number(),
  recovered: v.number(),
  energy: v.number(),
  soreness: v.number(),
  bodyConnection: v.number(),
  mentalStrength: v.number(),
  confidence: v.number(),
  focus: v.number(),
  stress: v.number(),
  readiness: v.number(),
  excitement: v.number(),
  sleep: v.number(),
  concerns: v.optional(v.string()),
  physicalScore: v.number(),
  mentalScore: v.number(),
  overallScore: v.number(),
};

export const insert = mutation({
  args: checkInFields,
  handler: async (ctx, args) => {
    return ctx.db.insert("dailyCheckIns", args);
  },
});

export const upsertForDate = mutation({
  args: checkInFields,
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("dailyCheckIns")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", args.userId).eq("checkInDate", args.checkInDate)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return ctx.db.insert("dailyCheckIns", args);
    }
  },
});

export const getById = query({
  args: { id: v.id("dailyCheckIns") },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("dailyCheckIns")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const patchById = mutation({
  args: { id: v.id("dailyCheckIns"), ...checkInFields },
  handler: async (ctx, { id, ...fields }) => {
    await ctx.db.patch(id, fields);
    return id;
  },
});

export const deleteById = mutation({
  args: { id: v.id("dailyCheckIns") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});

// Internal: used by data migration only — idempotent by legacyId
export const insertFromMigration = internalMutation({
  args: { ...checkInFields, legacyId: v.optional(v.number()) },
  handler: async (ctx, args) => {
    if (args.legacyId != null) {
      const existing = await ctx.db
        .query("dailyCheckIns")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", args.legacyId))
        .unique();
      if (existing) return existing._id;
    }
    return ctx.db.insert("dailyCheckIns", args);
  },
});

// Internal: used by the weekly coach email cron job
export const listWeekly = internalQuery({
  args: { userId: v.string(), since: v.string() },
  handler: async (ctx, { userId, since }) => {
    return ctx.db
      .query("dailyCheckIns")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("checkInDate"), since))
      .collect();
  },
});
