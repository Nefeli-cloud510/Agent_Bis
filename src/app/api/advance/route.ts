import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { PUBLIC_PAGES, type PublicStep } from "@/config/content";
import {
  SESSION_COOKIE,
  findSessionByToken,
  nextStepAfter,
  updateSessionStep,
} from "@/lib/session";
import { currentStep, pageForStep } from "@/lib/study-guard";

const ADVANCEABLE_STEPS = new Set<PublicStep>([
  "history",
  "permission",
  "task",
  "recommendation",
]);

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

  const body = (await request.json().catch(() => null)) as {
    fromStep?: string;
  } | null;
  const fromStep = body?.fromStep as PublicStep | undefined;
  if (!fromStep || !ADVANCEABLE_STEPS.has(fromStep)) {
    return NextResponse.json(
      { ok: false, error: "缺少有效的页面步骤。" },
      { status: 400 }
    );
  }

  if (session.current_step === "done" || session.submitted_at) {
    return NextResponse.json({ ok: true, nextUrl: PUBLIC_PAGES.done });
  }

  const expectedNext = nextStepAfter(fromStep);
  if (session.current_step === fromStep) {
    await updateSessionStep(session.id, expectedNext);
    return NextResponse.json({ ok: true, nextUrl: pageForStep(expectedNext) });
  }

  if (session.current_step === expectedNext) {
    // 网络响应丢失后的重试：服务端已经推进过，直接返回目标页。
    return NextResponse.json({ ok: true, nextUrl: pageForStep(expectedNext) });
  }

  const step = currentStep(session);
  return NextResponse.json(
    {
      ok: false,
      error: "会话状态已变化，已为你回到正确的实验页面。",
      currentUrl: pageForStep(step),
    },
    { status: 409 }
  );
}
