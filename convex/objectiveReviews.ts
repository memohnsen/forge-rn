import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const insert = mutation({
  args: {
    userId: v.string(),
    athleteVent: v.string(),
    coachReframe: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("objectiveReviews", args);
  },
});

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("objectiveReviews")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

// Internal: used by data migration only — idempotent by legacyId
export const insertFromMigration = internalMutation({
  args: {
    userId: v.string(),
    athleteVent: v.string(),
    coachReframe: v.string(),
    legacyId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (args.legacyId != null) {
      const existing = await ctx.db
        .query("objectiveReviews")
        .withIndex("by_legacyId", (q) => q.eq("legacyId", args.legacyId))
        .unique();
      if (existing) return existing._id;
    }
    return ctx.db.insert("objectiveReviews", args);
  },
});

export const deleteById = mutation({
  args: { id: v.id("objectiveReviews") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
