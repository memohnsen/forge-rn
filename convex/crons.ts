import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every Sunday at 9:00 AM UTC
crons.weekly(
  "send-coach-emails",
  { dayOfWeek: "sunday", hourUTC: 9, minuteUTC: 0 },
  internal.actions.sendCoachEmail.run,
  {}
);

export default crons;
