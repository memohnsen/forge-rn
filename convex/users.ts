import { v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    sport: v.string(),
    yearsOfExperience: v.number(),
    meetsPerYear: v.number(),
    goal: v.string(),
    biggestStruggle: v.string(),
    trainingDays: v.record(v.string(), v.string()),
    nextCompetition: v.optional(v.string()),
    nextCompetitionDate: v.optional(v.string()),
    currentTrackingMethod: v.optional(v.string()),
    biggestFrustration: v.optional(v.string()),
    reflectionFrequency: v.optional(v.string()),
    whatHoldingBack: v.optional(v.string()),
    coachEmail: v.optional(v.string()),
    ouraRefreshToken: v.optional(v.string()),
    whoopRefreshToken: v.optional(v.string()),
    storeToken: v.optional(v.boolean()),
    legacyId: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    } else {
      return ctx.db.insert("users", args);
    }
  },
});

export const updateMeet = mutation({
  args: {
    userId: v.string(),
    nextCompetition: v.string(),
    nextCompetitionDate: v.string(),
  },
  handler: async (ctx, { userId, nextCompetition, nextCompetitionDate }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { nextCompetition, nextCompetitionDate });
  },
});

export const updateCoachEmail = mutation({
  args: { userId: v.string(), coachEmail: v.string() },
  handler: async (ctx, { userId, coachEmail }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { coachEmail });
  },
});

export const updateTrainingDays = mutation({
  args: {
    userId: v.string(),
    trainingDays: v.record(v.string(), v.string()),
  },
  handler: async (ctx, { userId, trainingDays }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { trainingDays });
  },
});

export const updateName = mutation({
  args: {
    userId: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, { userId, firstName, lastName }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { firstName, lastName });
  },
});

export const updateOuraToken = mutation({
  args: { userId: v.string(), ouraRefreshToken: v.optional(v.string()) },
  handler: async (ctx, { userId, ouraRefreshToken }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { ouraRefreshToken });
  },
});

export const updateWhoopToken = mutation({
  args: { userId: v.string(), whoopRefreshToken: v.optional(v.string()) },
  handler: async (ctx, { userId, whoopRefreshToken }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { whoopRefreshToken });
  },
});

export const updateStoreToken = mutation({
  args: { userId: v.string(), storeToken: v.boolean() },
  handler: async (ctx, { userId, storeToken }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) throw new Error("User not found");
    await ctx.db.patch(user._id, { storeToken });
  },
});

// Internal: used by the weekly coach email cron job
export const getUsersWithCoachEmail = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allUsers = await ctx.db.query("users").collect();
    return allUsers.filter(
      (u) => u.coachEmail && u.storeToken === true
    );
  },
});

// Internal: used by sendCoachEmail to rotate Oura tokens after cron refresh
export const patchOuraToken = internalMutation({
  args: { userId: v.string(), ouraRefreshToken: v.optional(v.string()) },
  handler: async (ctx, { userId, ouraRefreshToken }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) return;
    await ctx.db.patch(user._id, { ouraRefreshToken });
  },
});

// Internal: used by sendCoachEmail to rotate WHOOP tokens after cron refresh
export const patchWhoopToken = internalMutation({
  args: { userId: v.string(), whoopRefreshToken: v.optional(v.string()) },
  handler: async (ctx, { userId, whoopRefreshToken }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!user) return;
    await ctx.db.patch(user._id, { whoopRefreshToken });
  },
});
