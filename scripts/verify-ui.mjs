import { chromium, request } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";
const forbidden = [
  "控制变量",
  "操纵变量",
  "操纵检查",
  "因变量",
  "中介变量",
  "实验组",
  "对照组",
];

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

async function assertNoResearchTerms(page, label) {
  const text = await page.locator("body").innerText();
  for (const term of forbidden) {
    if (text.includes(term)) {
      throw new Error(`${label} 页面出现了研究术语: ${term}`);
    }
  }
}

const browser = await chromium.launch({ channel: "chrome" });

const desktop = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "zh-CN",
});
let page = await desktop.newPage();
await page.goto(`${baseURL}/start`);
await assertNoResearchTerms(page, "知情同意");
await previewSession(page, 1);
await page.goto(`${baseURL}/records`);
await assertNoResearchTerms(page, "历史记录");
await page.getByRole("button", { name: "下一步", exact: true }).click();
await page.waitForURL(/\/permission$/);
await assertNoResearchTerms(page, "权限告知");
await page.getByRole("button", { name: "下一步", exact: true }).click();
await page.waitForURL(/\/task$/);
await assertNoResearchTerms(page, "购买任务");
await page.getByRole("button", { name: "查看推荐" }).click();
await page.waitForURL(/\/recommend$/);
await page.getByRole("button", { name: "发送", exact: true }).click();
await page.getByText(/好的，我整理了三款/).waitFor();
await assertNoResearchTerms(page, "推荐对话");
const desktopCards = await page.locator(".product-card").evaluateAll((nodes) =>
  nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { left: Math.round(rect.left), top: Math.round(rect.top) };
  })
);
console.log(
  "desktop grid columns:",
  await page.locator(".chat-product-grid").evaluate(
    (node) => getComputedStyle(node).gridTemplateColumns
  )
);
console.log(
  "desktop grid display:",
  await page.locator(".chat-product-grid").evaluate(
    (node) => getComputedStyle(node).display
  )
);
console.log(
  "chat panel border:",
  await page.locator(".chat-panel").evaluate(
    (node) => getComputedStyle(node).borderTopWidth
  )
);
if (new Set(desktopCards.map((card) => card.left)).size !== 3) {
  console.log("desktop card rects:", JSON.stringify(desktopCards));
  throw new Error("桌面端三张商品卡未并排");
}
if (desktopCards[0].top !== desktopCards[1].top || desktopCards[0].top !== desktopCards[2].top) {
  throw new Error("桌面端三张商品卡不在同一行");
}
await page.getByRole("button", { name: "前往问卷填写" }).click();
await page.waitForURL(/\/questionnaire$/);
await assertNoResearchTerms(page, "问卷");
await desktop.close();

const mobile = await browser.newContext({
  viewport: { width: 375, height: 812 },
  locale: "zh-CN",
});
page = await mobile.newPage();
await previewSession(page, 4);
await page.goto(`${baseURL}/records`);
await page.getByRole("button", { name: "下一步", exact: true }).click();
await page.waitForURL(/\/permission$/);
await page.getByRole("button", { name: "下一步", exact: true }).click();
await page.waitForURL(/\/task$/);
await page.getByRole("button", { name: "查看推荐" }).click();
await page.waitForURL(/\/recommend$/);
await page.getByRole("button", { name: "发送", exact: true }).click();
await page.getByText(/好的，我整理了三款/).waitFor();
const mobileCards = await page.locator(".product-card").evaluateAll((nodes) =>
  nodes.map((node) => {
    const rect = node.getBoundingClientRect();
    return { left: Math.round(rect.left), top: Math.round(rect.top) };
  })
);
if (new Set(mobileCards.map((card) => card.left)).size !== 1) {
  throw new Error("手机端商品卡未单列");
}
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth
);
if (overflow > 1) {
  throw new Error(`手机端推荐页横向溢出 ${overflow}px`);
}
await page.getByRole("button", { name: "前往问卷填写" }).click();
await page.waitForURL(/\/questionnaire$/);
const questionnaireText = await page.locator("body").innerText();
if (!questionnaireText.includes("使用体验") ||
    !questionnaireText.includes("体验回顾") ||
    !questionnaireText.includes("日常使用")) {
  throw new Error("问卷分节标题不完整");
}
await assertNoResearchTerms(page, "手机问卷");
await mobile.close();

await browser.close();
console.log("ui verification passed");
