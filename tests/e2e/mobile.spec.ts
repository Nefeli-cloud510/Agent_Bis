import { test, expect } from "@playwright/test";
import {
  cleanupSessions,
  createPreviewSession,
  fillAndSubmit,
} from "./helpers";

test.describe("手机端完整流程", () => {
  test.describe.configure({ mode: "serial" });
  const sessionIds: string[] = [];

  test.afterEach(async () => {
    await cleanupSessions(sessionIds.splice(0));
  });

  test("375px 视口完成有提醒、电脑包组的全流程且不横向溢出", async ({
    browser,
  }) => {
    const page = await browser.newPage({
      viewport: { width: 375, height: 812 },
    });
    const sessionId = await createPreviewSession(page, 4);
    sessionIds.push(sessionId);

    await expect(
      page.getByText("【三天内的会话】", { exact: true })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await expect(page).toHaveURL(/\/permission$/);
    await expect(
      page.getByText("本次推荐，AI 可以看到上方【最近一次会话】+【更早的会话】全部内容。", {
        exact: true,
      })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "下一步", exact: true }).click();
    await expect(page).toHaveURL(/\/task$/);
    await expect(
      page.getByText(
        "你要选购适配 14 英寸笔记本的电脑包，日常背着往返教室、图书馆。请查看智能体推荐结果。",
        { exact: true }
      )
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "查看推荐" }).click();
    await expect(page).toHaveURL(/\/recommend$/);
    await expect(page.locator(".product-card")).toHaveCount(3);
    const cards = await page.locator(".product-card").evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { left: rect.left, width: rect.width };
      })
    );
    expect(new Set(cards.map((card) => Math.round(card.left))).size).toBe(1);
    for (const card of cards) {
      expect(card.left).toBeGreaterThanOrEqual(0);
      expect(card.width).toBeLessThanOrEqual(375);
    }
    await expectNoHorizontalOverflow(page);

    await page.getByRole("button", { name: "前往问卷填写" }).click();
    await expect(page).toHaveURL(/\/questionnaire$/);
    await expectNoHorizontalOverflow(page);
    await fillAndSubmit(page);
    await expectNoHorizontalOverflow(page);
  });
});

async function expectNoHorizontalOverflow(
  page: import("@playwright/test").Page
): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}
