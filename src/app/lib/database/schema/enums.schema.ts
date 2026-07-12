import { pgEnum } from "drizzle-orm/pg-core";
import {
  SessionMode,
  SessionStatus,
} from "@/app/lib/storage/storage.constants.ts";

/**
 * How a session orders its questions. The Postgres enum values mirror the
 * `SessionMode` const-object union so the database and the app share a single
 * source of truth for the allowed literals.
 */
const sessionMode = pgEnum("session_mode", [
  SessionMode.sequential,
  SessionMode.random,
]);

/**
 * Lifecycle state of a session, mirroring the `SessionStatus` const-object
 * union.
 */
const sessionStatus = pgEnum("session_status", [
  SessionStatus.inProgress,
  SessionStatus.completed,
]);

export { sessionMode, sessionStatus };
