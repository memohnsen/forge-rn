import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const baseSession = {
  userId: "user_abc",
  sessionDate: "2025-01-15",
  timeOfDay: "Afternoon",
  selectedLift: "Snatch",
  selectedIntensity: "Heavy",
  sessionRpe: 8,
  movementQuality: 4,
  focus: 4,
  misses: "Third snatch at 100kg",
  cues: "Stay over the bar longer",
  feeling: 4,
  satisfaction: 4,
  confidence: 3,
  whatLearned: "Need more patience at the top",
  whatWouldChange: "Less volume on heavy day",
};

test("insert and retrieve a session report", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.sessionReports.insert, baseSession);
  const doc = await t.query(api.sessionReports.getById, { id });
  expect(doc).not.toBeNull();
  expect(doc?.userId).toBe("user_abc");
  expect(doc?.sessionDate).toBe("2025-01-15");
  expect(doc?.sessionRpe).toBe(8);
  expect(doc?.misses).toBe("Third snatch at 100kg");
});

test("listByUser is scoped to userId", async () => {
  const t = convexTest(schema);
  await t.mutation(api.sessionReports.insert, baseSession);
  await t.mutation(api.sessionReports.insert, {
    ...baseSession,
    userId: "user_other",
    sessionDate: "2025-01-16",
  });
  const results = await t.query(api.sessionReports.listByUser, {
    userId: "user_abc",
  });
  expect(results).toHaveLength(1);
  expect(results[0].userId).toBe("user_abc");
});

test("upsertForDate with id updates existing record", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.sessionReports.insert, baseSession);
  const id2 = await t.mutation(api.sessionReports.upsertForDate, {
    ...baseSession,
    id,
    sessionRpe: 9,
  });
  expect(id).toEqual(id2);
  const doc = await t.query(api.sessionReports.getById, { id });
  expect(doc?.sessionRpe).toBe(9);
  const results = await t.query(api.sessionReports.listByUser, {
    userId: "user_abc",
  });
  expect(results).toHaveLength(1);
});

test("upsertForDate without id creates a new record", async () => {
  const t = convexTest(schema);
  await t.mutation(api.sessionReports.upsertForDate, {
    ...baseSession,
  });
  const results = await t.query(api.sessionReports.listByUser, {
    userId: "user_abc",
  });
  expect(results).toHaveLength(1);
});

test("deleteById removes the record", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.sessionReports.insert, baseSession);
  await t.mutation(api.sessionReports.deleteById, { id });
  const doc = await t.query(api.sessionReports.getById, { id });
  expect(doc).toBeNull();
});

test("session stores optional whatLearned and whatWouldChange", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.sessionReports.insert, {
    ...baseSession,
    whatLearned: undefined,
    whatWouldChange: undefined,
  });
  const doc = await t.query(api.sessionReports.getById, { id });
  expect(doc?.whatLearned).toBeUndefined();
  expect(doc?.whatWouldChange).toBeUndefined();
});
