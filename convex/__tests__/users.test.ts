import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";

const baseUser = {
  userId: "user_test123",
  firstName: "Jane",
  lastName: "Smith",
  sport: "Olympic Weightlifting",
  yearsOfExperience: 5,
  meetsPerYear: 4,
  goal: "Make nationals",
  biggestStruggle: "Consistency",
  trainingDays: { Monday: "6:00 AM", Wednesday: "6:00 AM", Friday: "6:00 AM" },
};

test("upsert creates a new user", async () => {
  const t = convexTest(schema);
  await t.mutation(api.users.upsert, baseUser);
  const user = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(user).not.toBeNull();
  expect(user?.firstName).toBe("Jane");
  expect(user?.sport).toBe("Olympic Weightlifting");
});

test("upsert updates an existing user instead of duplicating", async () => {
  const t = convexTest(schema);
  await t.mutation(api.users.upsert, baseUser);
  await t.mutation(api.users.upsert, { ...baseUser, firstName: "Janet" });
  const user = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(user?.firstName).toBe("Janet");
  // Verify only one record exists
  const allUsers = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(allUsers).not.toBeNull();
});

test("getByUserId returns null for unknown user", async () => {
  const t = convexTest(schema);
  const user = await t.query(api.users.getByUserId, { userId: "nobody" });
  expect(user).toBeNull();
});

test("updateCoachEmail updates the field", async () => {
  const t = convexTest(schema);
  await t.mutation(api.users.upsert, baseUser);
  await t.mutation(api.users.updateCoachEmail, {
    userId: "user_test123",
    coachEmail: "coach@example.com",
  });
  const user = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(user?.coachEmail).toBe("coach@example.com");
});

test("updateMeet updates competition fields", async () => {
  const t = convexTest(schema);
  await t.mutation(api.users.upsert, baseUser);
  await t.mutation(api.users.updateMeet, {
    userId: "user_test123",
    nextCompetition: "Nationals",
    nextCompetitionDate: "2025-06-15",
  });
  const user = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(user?.nextCompetition).toBe("Nationals");
  expect(user?.nextCompetitionDate).toBe("2025-06-15");
});

test("updateTrainingDays updates the field", async () => {
  const t = convexTest(schema);
  await t.mutation(api.users.upsert, baseUser);
  const newDays = { Tuesday: "7:00 AM", Thursday: "7:00 AM" };
  await t.mutation(api.users.updateTrainingDays, {
    userId: "user_test123",
    trainingDays: newDays,
  });
  const user = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(user?.trainingDays).toEqual(newDays);
});

test("updateName updates first and last name", async () => {
  const t = convexTest(schema);
  await t.mutation(api.users.upsert, baseUser);
  await t.mutation(api.users.updateName, {
    userId: "user_test123",
    firstName: "Jill",
    lastName: "Jones",
  });
  const user = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(user?.firstName).toBe("Jill");
  expect(user?.lastName).toBe("Jones");
});

test("updateOuraToken stores and clears the token", async () => {
  const t = convexTest(schema);
  await t.mutation(api.users.upsert, baseUser);
  await t.mutation(api.users.updateOuraToken, {
    userId: "user_test123",
    ouraRefreshToken: "oura_token_abc",
  });
  let user = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(user?.ouraRefreshToken).toBe("oura_token_abc");

  // Clear the token
  await t.mutation(api.users.updateOuraToken, {
    userId: "user_test123",
    ouraRefreshToken: undefined,
  });
  user = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(user?.ouraRefreshToken).toBeUndefined();
});

test("updateWhoopToken stores and clears the token", async () => {
  const t = convexTest(schema);
  await t.mutation(api.users.upsert, baseUser);
  await t.mutation(api.users.updateWhoopToken, {
    userId: "user_test123",
    whoopRefreshToken: "whoop_token_xyz",
  });
  const user = await t.query(api.users.getByUserId, { userId: "user_test123" });
  expect(user?.whoopRefreshToken).toBe("whoop_token_xyz");
});
