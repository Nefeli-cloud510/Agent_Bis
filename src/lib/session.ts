import { createHash, randomBytes } from "node:crypto";
import { getPool } from "./db";
import { getGroupAssignment } from "./group";
import { getCollectionPhase } from "./env";
import type { PublicStep } from "@/config/content";

export const SESSION_COOKIE = "ds_session";

export type SessionRecord = {
  id: string;
  token_hash: string;
  assignment_group_id: number;
  remind: 0 | 1;
  scope: 1 | 2;
  goods: 1 | 2;
  collection_phase: "dev" | "pilot" | "formal";
  current_step: PublicStep;
  preview_group: number | null;
  submitted_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

export type SessionRow = {
  id: string;
  assignment_group_id: number;
  remind: number;
  scope: number;
  goods: number;
  collection_phase: "dev" | "pilot" | "formal";
  current_step: string;
  preview_group: number | null;
  idempotency_key: string | null;
  submitted_at: string | Date | null;
};

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function findSessionByToken(
  token: string | undefined
): Promise<SessionRow | null> {
  if (!token) return null;
  const result = await getPool().query(
    "SELECT * FROM participant_sessions WHERE token_hash = $1",
    [hashSessionToken(token)]
  );
  return (result.rows[0] as SessionRow | undefined) ?? null;
}

export async function createParticipantSession(options?: {
  groupOverride?: number;
  phaseOverride?: "dev" | "pilot" | "formal";
  idempotencyKey?: string;
}): Promise<{ token: string; row: SessionRow }> {
  const groupId = options?.groupOverride ?? (await new Promise<number>((resolve) => {
    resolve(Math.floor(Math.random() * 8) + 1);
  }));
  const assignment = getGroupAssignment(groupId);
  const token = newSessionToken();
  const phase = options?.phaseOverride ?? getCollectionPhase();
  const idempotencyKey = options?.idempotencyKey?.trim() || null;
  const result = await getPool().query(
    `INSERT INTO participant_sessions
       (token_hash, assignment_group_id, remind, scope, goods, collection_phase,
        current_step, preview_group, idempotency_key)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (idempotency_key) DO UPDATE
       SET token_hash = EXCLUDED.token_hash, updated_at = now()
     RETURNING *`,
    [
      hashSessionToken(token),
      groupId,
      assignment.reminder,
      assignment.scope,
      assignment.goods,
      phase,
      "consent",
      options?.groupOverride ?? null,
      idempotencyKey,
    ]
  );
  return { token, row: result.rows[0] as SessionRow };
}

export async function updateSessionStep(sessionId: string, step: PublicStep): Promise<void> {
  await getPool().query(
    "UPDATE participant_sessions SET current_step = $2, updated_at = now() WHERE id = $1",
    [sessionId, step]
  );
}

export function nextStepAfter(current: PublicStep): PublicStep {
  switch (current) {
    case "history":
      return "permission";
    case "permission":
      return "task";
    case "task":
      return "recommendation";
    case "recommendation":
      return "questionnaire";
    default:
      throw new Error(`当前步骤不能直接推进: ${current}`);
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await getPool().query("DELETE FROM participant_sessions WHERE id = $1", [sessionId]);
}
