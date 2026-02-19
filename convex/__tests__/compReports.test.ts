import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const baseComp = {
  userId: "user_abc",
  meet: "State Championships",
  selectedMeetType: "Weightlifting",
  meetDate: "2025-03-15",
  performanceRating: 4,
  physicalPreparednessRating: 4,
  mentalPreparednessRating: 3,
  satisfaction: 4,
  confidence: 4,
  pressureHandling: 3,
  didWell: "Hit all my snatches",
  needsWork: "Clean and jerk timing",
  goodFromTraining: "Consistency in warm-ups",
  cues: "Stay over the bar",
  focus: "Stay present between lifts",
  snatchAttempts: [
    { weight: "90", result: "good" as const },
    { weight: "94", result: "good" as const },
    { weight: "97", result: "no_lift" as const },
  ],
  snatchBest: 94,
  cjAttempts: [
    { weight: "115", result: "good" as const },
    { weight: "120", result: "good" as const },
    { weight: "124", result: "good" as const },
  ],
  cjBest: 124,
};

test("insert and retrieve a comp report", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.compReports.insert, baseComp);
  const doc = await t.query(api.compReports.getById, { id });
  expect(doc).not.toBeNull();
  expect(doc?.userId).toBe("user_abc");
  expect(doc?.meet).toBe("State Championships");
  expect(doc?.snatchBest).toBe(94);
  expect(doc?.cjBest).toBe(124);
});

test("attempt arrays store correctly", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.compReports.insert, baseComp);
  const doc = await t.query(api.compReports.getById, { id });
  expect(doc?.snatchAttempts).toHaveLength(3);
  expect(doc?.snatchAttempts?.[0]).toEqual({ weight: "90", result: "good" });
  expect(doc?.snatchAttempts?.[2]).toEqual({ weight: "97", result: "no_lift" });
  expect(doc?.cjAttempts).toHaveLength(3);
  expect(doc?.cjAttempts?.[2]).toEqual({ weight: "124", result: "good" });
});

test("powerlifting comp report with squat/bench/deadlift attempts", async () => {
  const t = convexTest(schema);
  const plComp = {
    ...baseComp,
    selectedMeetType: "Powerlifting",
    snatchAttempts: undefined,
    cjAttempts: undefined,
    snatchBest: undefined,
    cjBest: undefined,
    squatAttempts: [
      { weight: "200", result: "good" as const },
      { weight: "210", result: "good" as const },
      { weight: "215", result: "no_lift" as const },
    ],
    squatBest: 210,
    benchAttempts: [
      { weight: "130", result: "good" as const },
      { weight: "135", result: "good" as const },
    ],
    benchBest: 135,
    deadliftAttempts: [
      { weight: "240", result: "good" as const },
    ],
    deadliftBest: 240,
  };
  const id = await t.mutation(api.compReports.insert, plComp);
  const doc = await t.query(api.compReports.getById, { id });
  expect(doc?.squatBest).toBe(210);
  expect(doc?.benchBest).toBe(135);
  expect(doc?.deadliftBest).toBe(240);
  expect(doc?.squatAttempts).toHaveLength(3);
  expect(doc?.snatchAttempts).toBeUndefined();
});

test("listByUser is scoped to userId", async () => {
  const t = convexTest(schema);
  await t.mutation(api.compReports.insert, baseComp);
  await t.mutation(api.compReports.insert, {
    ...baseComp,
    userId: "user_other",
    meetDate: "2025-04-01",
  });
  const results = await t.query(api.compReports.listByUser, {
    userId: "user_abc",
  });
  expect(results).toHaveLength(1);
  expect(results[0].userId).toBe("user_abc");
});

test("upsert with id updates existing record", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.compReports.insert, baseComp);
  const id2 = await t.mutation(api.compReports.upsert, {
    ...baseComp,
    id,
    snatchBest: 97,
  });
  expect(id).toEqual(id2);
  const doc = await t.query(api.compReports.getById, { id });
  expect(doc?.snatchBest).toBe(97);
  const results = await t.query(api.compReports.listByUser, {
    userId: "user_abc",
  });
  expect(results).toHaveLength(1);
});

test("deleteById removes the record", async () => {
  const t = convexTest(schema);
  const id = await t.mutation(api.compReports.insert, baseComp);
  await t.mutation(api.compReports.deleteById, { id });
  const doc = await t.query(api.compReports.getById, { id });
  expect(doc).toBeNull();
});
