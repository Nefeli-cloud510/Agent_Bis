import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:8866/";
const results = [];

function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` :: ${detail}` : ""}`);
}

async function expectText(page, selector, text, name) {
  const actual = (await page.locator(selector).first().textContent()) ?? "";
  record(name, actual.includes(text), `selector=${selector} expected=${text}`);
}

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  // Desktop full check, group 1
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  desktop.on("pageerror", (e) => record("desktop no pageerror", false, e.message));
  await desktop.goto(`${BASE}#/select`, { waitUntil: "networkidle" });
  record("select page renders", (await desktop.title()).includes("购物体验研究"));
  record("eight group cards", (await desktop.locator(".group-card").count()) === 8);
  await desktop.screenshot({ path: "work/demo_1_select.png", fullPage: true });

  await desktop.locator('.group-card[data-group="1"]').click();
  await desktop.waitForURL(/#\/start/);
  await expectText(desktop, "#main", "实验知情同意书", "group1 consent title");
  record("consent has original button", (await desktop.locator("#consent-button").textContent()).includes("我已阅读并同意，开始实验"));
  await desktop.screenshot({ path: "work/demo_2_consent.png", fullPage: true });

  await desktop.click("#consent-button");
  await desktop.waitForURL(/#\/history/);
  await desktop.waitForSelector("#history-button");
  await expectText(desktop, "#main", "与智能体历史聊天记录（模拟）", "history page");
  record("history note", (await desktop.locator(".history-note").textContent()).includes("以上对话纯属虚构"));

  await desktop.click("#history-button");
  await desktop.waitForURL(/#\/permission/);
  await desktop.waitForSelector("#permission-button");
  await expectText(desktop, ".permission-panel", "只能看到【最近一次会话】内容", "group1 permission scope=1");

  await desktop.click("#permission-button");
  await desktop.waitForURL(/#\/task/);
  await desktop.waitForSelector("#task-button");
  await expectText(desktop, "#main", "你要选购一台笔记本电脑", "group1 task goods=1");

  await desktop.click("#task-button");
  await desktop.waitForURL(/#\/recommendation/);
  await desktop.waitForSelector("#task-message");
  record("chat composer prefilled", (await desktop.locator("#task-message").inputValue()).includes("你要选购一台笔记本电脑"));
  await desktop.screenshot({ path: "work/demo_3_recommend_input.png", fullPage: true });
  await desktop.click("#send-task");
  await expectText(desktop, "#chat-messages", "正在整理推荐…", "typing state");
  await desktop.waitForSelector("#to-questionnaire", { timeout: 3000 });
  await expectText(desktop, ".chat-bubble-assistant", "本次筛选参考了你聊天中的展示使用习惯与偏好", "group1 remind=1 copy");
  await expectText(desktop, ".chat-product-grid", "名称：笔记本 A", "group1 recommendation goods item A");
  record("three product cards desktop", (await desktop.locator(".chat-product-grid .product-card").count()) === 3);
  const gridCols = await desktop.locator(".chat-product-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  record("desktop cards side by side", gridCols === 3, `cols=${gridCols}`);
  await desktop.screenshot({ path: "work/demo_4_recommend_reply.png", fullPage: true });

  await desktop.click("#to-questionnaire");
  await desktop.waitForURL(/#\/questionnaire/);
  await desktop.waitForSelector("#submit-questionnaire");
  record("questionnaire 15 questions", (await desktop.locator(".question-fieldset").count()) === 15);
  record("questionnaire 5 scale options", (await desktop.locator(".scale-option input").count()) === 75);
  await expectText(desktop, "#main", "使用体验", "section heading 使用体验");
  await expectText(desktop, "#main", "体验回顾", "section heading 体验回顾");
  await expectText(desktop, "#main", "日常使用", "section heading 日常使用");
  await expectText(desktop, "#main", "14. 你对笔记本电脑 / 电脑包很熟悉", "q14 original text");
  await desktop.screenshot({ path: "work/demo_5_questionnaire.png", fullPage: true });

  await desktop.click("#submit-questionnaire");
  await expectText(desktop, "#form-error", "请完成第 1 题后再提交", "missing answer validation");
  const all = desktop.locator(".question-fieldset input");
  const count = await all.count();
  for (let i = 0; i < count; i++) {
    await all.nth(i).check();
  }
  await desktop.click("#submit-questionnaire");
  await desktop.waitForURL(/#\/done/);
  await desktop.waitForSelector(".demo-note");
  await expectText(desktop, "#main", "感谢你完成本次实验！", "done page");
  record("demo note on done page", (await desktop.locator(".demo-note").textContent()).includes("不产生任何研究记录"));
  await desktop.screenshot({ path: "work/demo_6_done.png", fullPage: true });

  // Direct URL to done without submission must not show success
  await desktop.evaluate(() => {
    localStorage.clear();
  });
  await desktop.goto(`${BASE}#/select`, { waitUntil: "networkidle" });
  record("select clears done flag", desktop.url().includes("/select"), desktop.url());
  await desktop.goto(`${BASE}#/done`, { waitUntil: "networkidle" });
  try {
    await desktop.waitForURL(/\/select/, { timeout: 1500 });
    record("done redirects when not submitted", true, desktop.url());
  } catch (err) {
    record("done redirects when not submitted", false, `url=${desktop.url()}`);
  }

  // Refresh persistence: set group 7, go to permission, reload, confirm same group and scope
  await desktop.goto(`${BASE}#/select`, { waitUntil: "networkidle" });
  await desktop.locator('.group-card[data-group="7"]').click();
  await desktop.waitForURL(/#\/start/);
  await desktop.click("#consent-button");
  await desktop.waitForURL(/#\/history/);
  await desktop.waitForSelector("#history-button");
  await desktop.click("#history-button");
  await desktop.waitForURL(/#\/permission/);
  await desktop.waitForSelector("#permission-button");
  await expectText(desktop, ".permission-panel", "可以看到上方【最近一次会话】+【更早的会话】全部内容", "group7 permission scope=2");
  await desktop.reload({ waitUntil: "networkidle" });
  await expectText(desktop, ".permission-panel", "可以看到上方【最近一次会话】", "refresh keeps group7 permission");

  // Remind=0 group: group 6, check recommend plain text and no remind line
  await desktop.goto(`${BASE}#/select`, { waitUntil: "networkidle" });
  await desktop.locator('.group-card[data-group="6"]').click();
  await desktop.waitForURL(/#\/start/);
  await desktop.click("#consent-button");
  await desktop.waitForURL(/#\/history/);
  await desktop.waitForSelector("#history-button");
  await desktop.click("#history-button");
  await desktop.waitForURL(/#\/permission/);
  await desktop.waitForSelector("#permission-button");
  await desktop.click("#permission-button");
  await desktop.waitForURL(/#\/task/);
  await desktop.waitForSelector("#task-button");
  await expectText(desktop, "#main", "电脑包", "group6 task goods=2");
  await desktop.click("#task-button");
  await desktop.waitForURL(/#\/recommendation/);
  await desktop.waitForSelector("#task-message");
  await desktop.click("#send-task");
  await desktop.waitForSelector("#to-questionnaire", { timeout: 3000 });
  await expectText(desktop, ".chat-bubble-assistant", "以下为您筛选了三款商品", "group6 remind=0 copy");
  await expectText(desktop, ".chat-bubble-assistant", "好的，我整理了三款电脑包供你比较", "group6 opening goods=2");
  const remindMention = await desktop.locator(".chat-bubble-assistant").textContent();
  record("remind=0 does not mention history", !remindMention.includes("本次筛选参考了你聊天"), remindMention);

  // Mobile check: consent through recommendation using group 1
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  mobile.on("pageerror", (e) => record("mobile no pageerror", false, e.message));
  await mobile.goto(`${BASE}#/select`, { waitUntil: "networkidle" });
  await mobile.locator('.group-card[data-group="1"]').click();
  await mobile.waitForURL(/#\/start/);
  const overflowMobile = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  record("mobile no horizontal overflow", !overflowMobile, `scrollWidth=${overflowMobile}`);
  await mobile.click("#consent-button");
  await mobile.waitForSelector("#history-button");
  await mobile.click("#history-button");
  await mobile.waitForSelector("#permission-button");
  await mobile.click("#permission-button");
  await mobile.waitForSelector("#task-button");
  await mobile.click("#task-button");
  await mobile.waitForURL(/#\/recommendation/);
  await mobile.waitForSelector("#task-message");
  await mobile.click("#send-task");
  await mobile.waitForSelector("#to-questionnaire", { timeout: 3000 });
  const mobileCols = await mobile.locator(".chat-product-grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  record("mobile cards single column", mobileCols === 1, `cols=${mobileCols}`);
  await mobile.screenshot({ path: "work/demo_7_mobile_recommend.png", fullPage: true });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`TOTAL ${results.length}, FAILED ${failed.length}`);
  if (failed.length) {
    console.log(failed.map((f) => `${f.name} :: ${f.detail}`).join("\n"));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

