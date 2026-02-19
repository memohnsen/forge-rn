/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_elevenlabsProxy from "../actions/elevenlabsProxy.js";
import type * as actions_exportData from "../actions/exportData.js";
import type * as actions_generateVisualizationAudio from "../actions/generateVisualizationAudio.js";
import type * as actions_migrationImport from "../actions/migrationImport.js";
import type * as actions_openrouterProxy from "../actions/openrouterProxy.js";
import type * as actions_ouraTokenExchange from "../actions/ouraTokenExchange.js";
import type * as actions_sendCoachEmail from "../actions/sendCoachEmail.js";
import type * as actions_whoopTokenExchange from "../actions/whoopTokenExchange.js";
import type * as compReports from "../compReports.js";
import type * as crons from "../crons.js";
import type * as dailyCheckIns from "../dailyCheckIns.js";
import type * as migrations from "../migrations.js";
import type * as objectiveReviews from "../objectiveReviews.js";
import type * as sessionReports from "../sessionReports.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/elevenlabsProxy": typeof actions_elevenlabsProxy;
  "actions/exportData": typeof actions_exportData;
  "actions/generateVisualizationAudio": typeof actions_generateVisualizationAudio;
  "actions/migrationImport": typeof actions_migrationImport;
  "actions/openrouterProxy": typeof actions_openrouterProxy;
  "actions/ouraTokenExchange": typeof actions_ouraTokenExchange;
  "actions/sendCoachEmail": typeof actions_sendCoachEmail;
  "actions/whoopTokenExchange": typeof actions_whoopTokenExchange;
  compReports: typeof compReports;
  crons: typeof crons;
  dailyCheckIns: typeof dailyCheckIns;
  migrations: typeof migrations;
  objectiveReviews: typeof objectiveReviews;
  sessionReports: typeof sessionReports;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
