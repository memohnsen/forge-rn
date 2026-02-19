import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const baseCheckIn = {
  userId: "user_abc",
  checkInDate: "2025-01-15",
  selectedLift: "Squats",
  selectedIntensity: "Heavy",
  goal: "Hit a PR",
  physicalStrength: 4,
  recovered: 5,
  energy: 4,
  soreness: 2,
  bodyConnection: 4,
  mentalStrength: 4,
  confidence: 4,
  focus: 5,
  stress: 2,
  readiness: 4,
  excitement: 5,
  sleep: 4,
  physicalScore: 80,
  mentalScore: 85,
  overallScore: 82,
};

test("insert and retrieve a check-in", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.dailyCheckIns.insert, baseCheckIn);
  const doc = await t.query(api.dailyCheckIns.getById, { id });
  expect(doc).not.toBeNull();
  expect(doc?.userId).toBe("user_abc");
  expect(doc?.checkInDate).toBe("2025-01-15");
  expect(doc?.overallScore).toBe(82);
  expect(doc?.selectedLift).toBe("Squats");
});

test("listByUser is scoped to userId", async () => {
  const t = convexTest(schema);
  await t.mutation(api.dailyCheckIns.insert, baseCheckIn);
  await t.mutation(api.dailyCheckIns.insert, {
    ...baseCheckIn,
    userId: "user_other",
    checkInDate: "2025-01-16",
  });
  const results = await t.query(api.dailyCheckIns.listByUser, {
    userId: "user_abc",
  });
  expect(results).toHaveLength(1);
  expect(results[0].userId).toBe("user_abc");
});

test("listByUser returns multiple records for same user", async () => {
  const t = convexTest(schema);
  await t.mutation(api.dailyCheckIns.insert, baseCheckIn);
  await t.mutation(api.dailyCheckIns.insert, {
    ...baseCheckIn,
    checkInDate: "2025-01-16",
  });
  await t.mutation(api.dailyCheckIns.insert, {
    ...baseCheckIn,
    checkInDate: "2025-01-17",
  });
  const results = await t.query(api.dailyCheckIns.listByUser, {
    userId: "user_abc",
  });
  expect(results).toHaveLength(3);
});

test("upsertForDate updates existing record for same date", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.dailyCheckIns.upsertForDate, baseCheckIn);
  // Same user + date, update the score
  const id2 = await t.mutation(api.dailyCheckIns.upsertForDate, {
    ...baseCheckIn,
    overallScore: 90,
  });
  expect(id).toEqual(id2);
  const doc = await t.query(api.dailyCheckIns.getById, { id });
  expect(doc?.overallScore).toBe(90);
  // Verify only one record
  const results = await t.query(api.dailyCheckIns.listByUser, {
    userId: "user_abc",
  });
  expect(results).toHaveLength(1);
});

test("upsertForDate creates new record for different date", async () => {
  const t = convexTest(schema);
  await t.mutation(api.dailyCheckIns.upsertForDate, baseCheckIn);
  await t.mutation(api.dailyCheckIns.upsertForDate, {
    ...baseCheckIn,
    checkInDate: "2025-01-16",
  });
  const results = await t.query(api.dailyCheckIns.listByUser, {
    userId: "user_abc",
  });
  expect(results).toHaveLength(2);
});

test("deleteById removes the record", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.dailyCheckIns.insert, baseCheckIn);
  await t.mutation(api.dailyCheckIns.deleteById, { id });
  const doc = await t.query(api.dailyCheckIns.getById, { id });
  expect(doc).toBeNull();
});

test("check-in stores optional concerns field", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.dailyCheckIns.insert, {
    ...baseCheckIn,
    concerns: "Feeling a bit under the weather",
  });
  const doc = await t.query(api.dailyCheckIns.getById, { id });
  expect(doc?.concerns).toBe("Feeling a bit under the weather");
});
