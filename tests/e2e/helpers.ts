import { createHash } from "node:crypto";
import {
  expect,
  request,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { Pool } from "pg";

const DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgres://postgres:postgres@127.0.0.1:55432/d_demo";
const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "LocalDevAdmin!2026";

export const pool = new Pool({ connectionString: DATABASE_URL, max: 5 });

export async function createPreviewSession(
  page: Page,
  groupId: number
): Promise<string> {
  await page.goto("/start");
  const api = await request.newContext({ baseURL: BASE_URL });
  try {
    const login = await api.post("/api/admin/login", {
      data: { username: ADMIN_USERNAME, password: ADMIN_PASSWORD },
    });
    if (!login.ok()) throw new Error("管理员登录失败");
    const preview = await api.post("/api/admin/preview", {
      data: { group: groupId },
    });
    if (!preview.ok()) {
      throw new Error(`固定组预览失败: ${await preview.text()}`);
    }
    const participantCookie = (await api.cookies()).find(
      (cookie) => cookie.name === "ds_session"
    );
    if (!participantCookie) throw new Error("预览会话未返回 Cookie");
    await page.context().addCookies([participantCookie]);
  } finally {
    await api.dispose();
  }
  await page.goto("/records");
  await expect(page).toHaveURL(/\/records$/);
  return getSessionId(page.context());
}

export async function getSessionId(context: BrowserContext): Promise<string> {
  const dsCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "ds_session"
  );
  if (!dsCookie) throw new Error("浏览器上下文中没有 ds_session");
  const hash = createHash("sha256").update(dsCookie.value).digest("hex");
  const result = await pool.query(
    "SELECT id::text AS id FROM participant_sessions WHERE token_hash = $1",
    [hash]
  );
  const sessionId = result.rows[0]?.id as string | undefined;
  if (!sessionId) throw new Error("数据库中没有匹配的参与会话");
  return sessionId;
}

export async function cleanupSessions(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  for (const sessionId of sessionIds) {
    await pool.query("DELETE FROM submissions WHERE session_id = $1", [
      sessionId,
    ]);
    await pool.query("DELETE FROM participant_sessions WHERE id = $1", [
      sessionId,
    ]);
  }
}

export async function advanceToQuestionnaire(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: "与智能体历史聊天记录（模拟）" })).toBeVisible();
  await page.getByRole("button", { name: "下一步", exact: true }).click();

  await expect(page).toHaveURL(/\/permission$/);
  await expect(page.getByRole("heading", { name: "AI 读取权限设置" })).toBeVisible();
  await page.getByRole("button", { name: "下一步", exact: true }).click();

  await expect(page).toHaveURL(/\/task$/);
  await expect(page.getByRole("heading", { name: "本次购物任务" })).toBeVisible();
  await page.getByRole("button", { name: "查看推荐" }).click();

  await expect(page).toHaveURL(/\/recommend$/);
  await sendTaskAndWaitForReply(page);
  await page.getByRole("button", { name: "前往问卷填写" }).click();
  await expect(page).toHaveURL(/\/questionnaire$/);
  await expect(page.getByText("请根据刚才智能体推荐的感受作答")).toBeVisible();
}

export async function sendTaskAndWaitForReply(page: Page): Promise<void> {
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await expect(page.getByText("正在整理推荐…")).toBeVisible();
  await expect(page.getByText(/好的，我整理了三款/)).toBeVisible();
}

export async function fillAndSubmit(page: Page): Promise<void> {
  for (let index = 1; index <= 15; index += 1) {
    const id = `q${String(index).padStart(2, "0")}`;
    await page.locator(`input[name="${id}"][value="3"]`).check();
  }
  await page.getByRole("button", { name: "提交", exact: true }).click();
  await expect(page).toHaveURL(/\/done$/);
  await expect(page.getByText("感谢你完成本次实验！")).toBeVisible();
}
