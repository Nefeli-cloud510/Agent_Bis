import { chromium, request } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";
const outDir =
  "C:/Users/admin/Documents/Codex/2026-10-24/d-demo/outputs/screenshots";

async function previewSession(page, groupId) {
  const api = await request.newContext({ baseURL });
  try {
    const login = await api.post("/api/admin/login", {
      data: { username: "admin", password: "LocalDevAdmin!2026" },
    });
    if (!login.ok()) throw new Error("管理员登录失败");
    const preview = await api.post("/api/admin/preview", {
      data: { group: groupId },
    });
    if (!preview.ok()) throw new Error(`固定组预览失败: ${await preview.text()}`);
    const cookie = (await api.cookies()).find(
      (item) => item.name === "ds_session"
    );
    if (!cookie) throw new Error("预览会话未返回 Cookie");
    await page.context().addCookies([cookie]);
  } finally {
    await api.dispose();
  }
}

async function reachRecommendation(page, groupId) {
  await previewSession(page, groupId);
  await page.goto(`${baseURL}/records`);
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.waitForURL(/\/permission$/);
  await page.getByRole("button", { name: "下一步", exact: true }).click();
  await page.waitForURL(/\/task$/);
  await page.getByRole("button", { name: "查看推荐" }).click();
  await page.waitForURL(/\/recommend$/);
  await page.getByRole("button", { name: "发送", exact: true }).click();
  await page.getByText(/好的，我整理了三款/).waitFor();
  await page.locator(".product-card").first().waitFor();
}

const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
});

const desktop = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "zh-CN",
});
let page = await desktop.newPage();
await reachRecommendation(page, 1);
await page.screenshot({
  path: `${outDir}/recommend-chat-laptop-desktop.png`,
  fullPage: true,
});
await page.getByRole("button", { name: "前往问卷填写" }).click();
await page.getByText("请根据刚才智能体推荐的感受作答").waitFor();
await page.screenshot({
  path: `${outDir}/questionnaire-desktop.png`,
  fullPage: true,
});
await desktop.close();

const mobile = await browser.newContext({
  viewport: { width: 375, height: 812 },
  locale: "zh-CN",
});
page = await mobile.newPage();
await reachRecommendation(page, 4);
await page.screenshot({
  path: `${outDir}/recommend-chat-bag-mobile.png`,
  fullPage: true,
});
await page.getByRole("button", { name: "前往问卷填写" }).click();
await page.getByText("请根据刚才智能体推荐的感受作答").waitFor();
await page.screenshot({
  path: `${outDir}/questionnaire-mobile.png`,
  fullPage: true,
});
await mobile.close();

await browser.close();
console.log("screenshots saved");
