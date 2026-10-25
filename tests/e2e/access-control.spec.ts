import { test, expect } from "@playwright/test";
import {
  advanceToQuestionnaire,
  cleanupSessions,
  createPreviewSession,
  getSessionId,
  pool,
} from "./helpers";

test.describe("流程控制与数据安全", () => {
  test.describe.configure({ mode: "serial" });
  const sessionIds: string[] = [];

  test.afterEach(async () => {
    await cleanupSessions(sessionIds.splice(0));
  });

  test("未登录不能查看后台或导出", async ({ request }) => {
    const adminPage = await request.get("/admin");
    expect(adminPage.status()).toBe(200); // 服务端渲染的登录页
    const raw = await request.get("/api/admin/export/raw");
    expect(raw.status()).toBe(401);
    const summary = await request.get("/api/admin/export/group-summary");
    expect(summary.status()).toBe(401);
  });

  test("无会话不能直接访问权限页或问卷页", async ({ page }) => {
    await page.goto("/permission");
    await expect(page).toHaveURL(/\/start$/);
    await page.goto("/questionnaire");
    await expect(page).toHaveURL(/\/start$/);
  });

  test("未到权限步骤时无法通过 URL 看到权限页，刷新不换位置", async ({ page }) => {
    const sessionId = await createPreviewSession(page, 5);
    sessionIds.push(sessionId);

    await page.reload();
    await expect(page).toHaveURL(/\/records$/);

    await page.goto("/permission");
    await expect(page).toHaveURL(/\/records$/);
    await expect(page.getByText("AI 读取权限设置")).toHaveCount(0);

    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await expect(page).toHaveURL(/\/permission$/);
    await expect(
      page.getByText(
        "本次推荐，AI 只能看到【最近一次会话】内容，看不到更早记录。",
        { exact: true }
      )
    ).toBeVisible();
    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await expect(page).toHaveURL(/\/task$/);

    await page.goto("/questionnaire");
    await expect(page).toHaveURL(/\/task$/);
    await page.goto("/recommend");
    await expect(page).toHaveURL(/\/task$/);
  });

  test("同意接口幂等：相同键只创建一个会话", async ({ page }) => {
    await page.goto("/start");
    const key = `e2e-consent-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const first = await page.evaluate(async (idempotencyKey) => {
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromStep: "consent", idempotencyKey }),
      });
      return response.json();
    }, key);
    const second = await page.evaluate(async (idempotencyKey) => {
      const response = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromStep: "consent", idempotencyKey }),
      });
      return response.json();
    }, key);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);

    const sessionId = await getSessionId(page.context());
    sessionIds.push(sessionId);
    const result = await pool.query(
      "SELECT count(*)::int AS count FROM participant_sessions WHERE idempotency_key = $1",
      [key]
    );
    expect(result.rows[0].count).toBe(1);
    await page.reload();
    await expect(page).toHaveURL(/\/records$/);
  });

  test("连续提交和超时重试只落一条数据", async ({ page }) => {
    const sessionId = await createPreviewSession(page, 1);
    sessionIds.push(sessionId);
    await advanceToQuestionnaire(page);
    for (let index = 1; index <= 15; index += 1) {
      await page
        .locator(`input[name="q${String(index).padStart(2, "0")}"][value="3"]`)
        .check();
    }
    const statuses = await page.evaluate(async () => {
      const answers = Object.fromEntries(
        Array.from({ length: 15 }, (_, index) => [
          `q${String(index + 1).padStart(2, "0")}`,
          3,
        ])
      );
      const body = JSON.stringify({
        answers,
        timings: {
          consent_active_ms: 1200,
          history_active_ms: 1200,
          permission_active_ms: 1200,
          task_active_ms: 1200,
          recommendation_active_ms: 1200,
          questionnaire_active_ms: 1200,
        },
        pageVisits: [],
      });
      const [a, b] = await Promise.all([
        fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }),
        fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }),
      ]);
      return [a.status, b.status, await a.text(), await b.text()];
    });
    expect(statuses[0]).toBe(200);
    expect(statuses[1]).toBe(200);
    const count = await pool.query(
      "SELECT count(*)::int AS count FROM submissions WHERE session_id = $1",
      [sessionId]
    );
    expect(count.rows[0].count).toBe(1);
  });

  test("断网不显示虚假成功，恢复后重试成功", async ({ page }) => {
    const sessionId = await createPreviewSession(page, 2);
    sessionIds.push(sessionId);
    await advanceToQuestionnaire(page);
    for (let index = 1; index <= 15; index += 1) {
      await page
        .locator(`input[name="q${String(index).padStart(2, "0")}"][value="3"]`)
        .check();
    }

    await page.context().setOffline(true);
    await page.getByRole("button", { name: "提交", exact: true }).click();
    await expect(page.getByText("提交未成功，请检查网络后重试")).toBeVisible();
    await expect(page).toHaveURL(/\/questionnaire$/);

    await page.context().setOffline(false);
    await page.getByRole("button", { name: "提交", exact: true }).click();
    await expect(page).toHaveURL(/\/done$/);
    const count = await pool.query(
      "SELECT count(*)::int AS count FROM submissions WHERE session_id = $1",
      [sessionId]
    );
    expect(count.rows[0].count).toBe(1);
  });

  test("主动退出不产生样本并清除会话", async ({ page }) => {
    const sessionId = await createPreviewSession(page, 6);
    sessionIds.push(sessionId);
    await page.getByRole("button", { name: "退出实验" }).click();
    await expect(page).toHaveURL(/\/exited$/);
    const session = await pool.query(
      "SELECT id FROM participant_sessions WHERE id = $1",
      [sessionId]
    );
    expect(session.rowCount).toBe(0);
    const submissions = await pool.query(
      "SELECT id FROM submissions WHERE session_id = $1",
      [sessionId]
    );
    expect(submissions.rowCount).toBe(0);
  });

  test("管理员登录后可导出带 BOM 的 CSV", async ({ request }) => {
    const login = await request.post("/api/admin/login", {
      data: { username: "admin", password: "LocalDevAdmin!2026" },
    });
    expect(login.status()).toBe(200);
    const raw = await request.get("/api/admin/export/raw");
    expect(raw.status()).toBe(200);
    expect(raw.headers()["content-type"]).toContain("text/csv");
    const body = await raw.body();
    expect(body[0]).toBe(0xef);
    expect(body[1]).toBe(0xbb);
    expect(body[2]).toBe(0xbf);
    const dictionary = await request.get("/api/admin/export/variable-dictionary");
    expect(dictionary.status()).toBe(200);
    expect(await dictionary.text()).toContain("participant_id");
    expect(await dictionary.text()).toContain("q01");
  });
});
