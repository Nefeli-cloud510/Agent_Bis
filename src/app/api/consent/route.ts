import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PUBLIC_PAGES, type PublicStep } from "@/config/content";
import {
  SESSION_COOKIE,
  createParticipantSession,
  findSessionByToken,
  updateSessionStep,
} from "@/lib/session";
import { pageForStep } from "@/lib/study-guard";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12,
};

export async function POST(request: Request) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const existing = await findSessionByToken(token);
    if (existing) {
      if (existing.current_step === "consent") {
        await updateSessionStep(existing.id, "history");
        return NextResponse.json({ ok: true, nextUrl: PUBLIC_PAGES.history });
      }
      const target =
        existing.current_step === "done"
          ? PUBLIC_PAGES.done
          : pageForStep(existing.current_step as PublicStep);
      return NextResponse.json({ ok: true, nextUrl: target });
    }
  }

  const body = (await request.json().catch(() => null)) as {
    idempotencyKey?: unknown;
  } | null;
  const idempotencyKey =
    typeof body?.idempotencyKey === "string" ? body.idempotencyKey.trim() : "";
  if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 80)) {
    return NextResponse.json(
      { ok: false, error: "请求标识无效，请刷新页面后重试。" },
      { status: 400 }
    );
  }

  const created = await createParticipantSession({
    idempotencyKey: idempotencyKey || undefined,
  });
  const nextStep =
    created.row.current_step === "consent"
      ? "history"
      : (created.row.current_step as PublicStep);
  if (created.row.current_step === "consent") {
    await updateSessionStep(created.row.id, "history");
  }
  const target =
    nextStep === "done"
      ? PUBLIC_PAGES.done
      : pageForStep(nextStep);
  const response = NextResponse.json({
    ok: true,
    nextUrl: target,
  });
  response.cookies.set(SESSION_COOKIE, created.token, COOKIE_OPTIONS);
  return response;
}
