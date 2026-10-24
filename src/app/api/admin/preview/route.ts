import { NextResponse } from "next/server";
import { PUBLIC_PAGES } from "@/config/content";
import { createParticipantSession, updateSessionStep } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/session";
import { allowGroupPreview } from "@/lib/env";
import { requireAdminForApi } from "@/lib/admin-guard";

export async function POST(request: Request) {
  const username = await requireAdminForApi();
  if (!username) {
    return NextResponse.json(
      { ok: false, error: "需要管理员登录。" },
      { status: 401 }
    );
  }
  if (!allowGroupPreview()) {
    return NextResponse.json(
      { ok: false, error: "固定组预览未开放。" },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    group?: number;
  } | null;
  const groupId = Number(body?.group);
  if (!Number.isInteger(groupId) || groupId < 1 || groupId > 8) {
    return NextResponse.json(
      { ok: false, error: "组别必须为 1 至 8。" },
      { status: 400 }
    );
  }

  const created = await createParticipantSession({
    groupOverride: groupId,
    phaseOverride: "dev",
  });
  await updateSessionStep(created.row.id, "history");
  const response = NextResponse.json({
    ok: true,
    nextUrl: PUBLIC_PAGES.history,
  });
  response.cookies.set(SESSION_COOKIE, created.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
