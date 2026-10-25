import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PUBLIC_PAGES, type PublicStep } from "@/config/content";
import {
  SESSION_COOKIE,
  findSessionByToken,
  type SessionRow,
} from "./session";

export const STUDY_STEPS = [
  { id: "consent", label: "知情同意" },
  { id: "history", label: "历史记录" },
  { id: "permission", label: "权限告知" },
  { id: "task", label: "购买任务" },
  { id: "recommendation", label: "推荐结果" },
  { id: "questionnaire", label: "问卷" },
] as const;

export function stepsForSession() {
  return STUDY_STEPS;
}

export function pageForStep(step: PublicStep): string {
  return PUBLIC_PAGES[step];
}

export function isPublicStep(value: string): value is PublicStep {
  return Object.prototype.hasOwnProperty.call(PUBLIC_PAGES, value);
}

export async function getParticipantSession(): Promise<SessionRow | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findSessionByToken(token);
}

export async function requireParticipantSession(): Promise<SessionRow> {
  const session = await getParticipantSession();
  if (!session) redirect(pageForStep("consent"));
  return session;
}

export function requireStep(session: SessionRow, step: PublicStep): void {
  if (session.current_step !== step) {
    redirectToCurrentStep(session);
  }
}

export function redirectToCurrentStep(session: SessionRow): never {
  const step = session.current_step;
  redirect(isPublicStep(step) ? pageForStep(step) : pageForStep("consent"));
}

export function currentStep(session: SessionRow): PublicStep {
  return isPublicStep(session.current_step)
    ? session.current_step
    : "consent";
}
