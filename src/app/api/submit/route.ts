import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  MATERIAL_VERSION,
  PUBLIC_PAGES,
  QUESTIONNAIRE_VERSION,
} from "@/config/content";
import { getPool } from "@/lib/db";
import { computeQualityFlags, computeSubmissionFields } from "@/lib/quality";
import {
  SESSION_COOKIE,
  findSessionByToken,
} from "@/lib/session";
import { currentStep, pageForStep } from "@/lib/study-guard";
import { submitBodySchema } from "@/lib/validation";

const QUESTION_COLUMNS = Array.from({ length: 15 }, (_, index) =>
  `q${String(index + 1).padStart(2, "0")}`
);

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "23505"
  );
}

export async function POST(request: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = token ? await findSessionByToken(token) : null;
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "会话已失效，请回到实验开始页。" },
      { status: 401 }
    );
  }

  if (session.current_step === "done" || session.submitted_at) {
    return NextResponse.json({ ok: true, nextUrl: PUBLIC_PAGES.done });
  }
  if (session.current_step !== "questionnaire") {
    return NextResponse.json(
      {
        ok: false,
        error: "请按实验流程先完成前面步骤。",
        currentUrl: pageForStep(currentStep(session)),
      },
      { status: 409 }
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await request.text());
  } catch {
    return NextResponse.json(
      { ok: false, error: "提交内容不是有效的 JSON。" },
      { status: 400 }
    );
  }

  const validation = submitBodySchema.safeParse(parsed);
  if (!validation.success) {
    return NextResponse.json(
      { ok: false, error: "答案必须为 1 至 5 的整数，且 15 题全部提交。" },
      { status: 400 }
    );
  }
  const body = validation.data;

  // flow-v2 起八组统一经过权限告知页。
  const permissionPageShown = true;
  const submissionTimings = computeSubmissionFields(
    body.timings,
    permissionPageShown
  );
  const qualityFlags = computeQualityFlags({
    answers: body.answers,
    totalActiveMs: submissionTimings.total_active_ms,
    permissionPageShown,
    permissionActiveMs: submissionTimings.permission_active_ms,
    timingsProvided: body.timings !== undefined,
  });

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const existing = await client.query(
      "SELECT id FROM submissions WHERE session_id = $1",
      [session.id]
    );
    if (existing.rowCount && existing.rowCount > 0) {
      await client.query("COMMIT");
      return NextResponse.json({ ok: true, nextUrl: PUBLIC_PAGES.done });
    }

    const params: unknown[] = [
      `P-${session.id}`,
      session.id,
      session.assignment_group_id,
      session.remind,
      session.scope,
      session.goods,
      permissionPageShown,
      MATERIAL_VERSION,
      QUESTIONNAIRE_VERSION,
      session.collection_phase,
      submissionTimings.total_active_ms,
      submissionTimings.consent_active_ms,
      submissionTimings.history_active_ms,
      submissionTimings.permission_active_ms,
      submissionTimings.task_active_ms,
      submissionTimings.recommendation_active_ms,
      submissionTimings.questionnaire_active_ms,
      JSON.stringify(body.pageVisits ?? []),
      JSON.stringify(qualityFlags),
      ...QUESTION_COLUMNS.map((column) => body.answers[column]),
    ];

    const inserted = await client.query(
      `INSERT INTO submissions (
        participant_id, session_id, group_id, remind, scope, goods,
        permission_page_shown, material_version, questionnaire_version,
        collection_phase, total_active_ms, consent_active_ms, history_active_ms,
        permission_active_ms, task_active_ms, recommendation_active_ms,
        questionnaire_active_ms, page_visits, quality_flags,
        ${QUESTION_COLUMNS.join(", ")}
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34
      ) RETURNING id`,
      params
    );

    await client.query(
      `UPDATE participant_sessions
       SET current_step = 'done', submitted_at = now(), updated_at = now()
       WHERE id = $1`,
      [session.id]
    );
    await client.query("COMMIT");
    return NextResponse.json({
      ok: true,
      nextUrl: PUBLIC_PAGES.done,
      submissionId: inserted.rows[0].id,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    if (isUniqueViolation(error)) {
      await getPool().query(
        `UPDATE participant_sessions
         SET current_step = 'done',
             submitted_at = COALESCE(submitted_at, now()),
             updated_at = now()
         WHERE id = $1`,
        [session.id]
      );
      return NextResponse.json({ ok: true, nextUrl: PUBLIC_PAGES.done });
    }
    throw error;
  } finally {
    client.release();
  }
}
