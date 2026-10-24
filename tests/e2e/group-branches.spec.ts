import { test, expect } from "@playwright/test";
import {
  cleanupSessions,
  createPreviewSession,
  fillAndSubmit,
  pool,
} from "./helpers";

type GroupExpectation = {
  remind: 0 | 1;
  scope: 1 | 2;
  goods: 1 | 2;
  permissionText?: string;
  remindText: string;
  taskText: string;
  productCount: number;
  firstProduct: string;
};

const EXPECTATIONS: Record<number, GroupExpectation> = {
  1: {
    remind: 1,
    scope: 1,
    goods: 1,
    permissionText: "本次推荐，AI 只能看到【最近一次会话】内容，看不到更早记录。",
    remindText: "本次筛选参考了你聊天中的展示使用习惯与偏好",
    taskText: "你要选购一台笔记本电脑，用于上课、写作业与数据分析，请查看智能体推荐结果。",
    productCount: 3,
    firstProduct: "名称：笔记本 A",
  },
  2: {
    remind: 1,
    scope: 1,
    goods: 2,
    permissionText: "本次推荐，AI 只能看到【最近一次会话】内容，看不到更早记录。",
    remindText: "本次筛选参考了你聊天中的展示使用习惯与偏好",
    taskText: "你要选购适配 14 英寸笔记本的电脑包，日常背着往返教室、图书馆。请查看智能体推荐结果。",
    productCount: 3,
    firstProduct: "名称：电脑包 A",
  },
  3: {
    remind: 1,
    scope: 2,
    goods: 1,
    permissionText: "本次推荐，AI 可以看到上方【最近一次会话】+【更早的会话】全部内容。",
    remindText: "本次筛选参考了你聊天中的展示使用习惯与偏好",
    taskText: "你要选购一台笔记本电脑，用于上课、写作业与数据分析，请查看智能体推荐结果。",
    productCount: 3,
    firstProduct: "名称：笔记本 A",
  },
  4: {
    remind: 1,
    scope: 2,
    goods: 2,
    permissionText: "本次推荐，AI 可以看到上方【最近一次会话】+【更早的会话】全部内容。",
    remindText: "本次筛选参考了你聊天中的展示使用习惯与偏好",
    taskText: "你要选购适配 14 英寸笔记本的电脑包，日常背着往返教室、图书馆。请查看智能体推荐结果。",
    productCount: 3,
    firstProduct: "名称：电脑包 A",
  },
  5: {
    remind: 0,
    scope: 1,
    goods: 1,
    remindText: "以下为您筛选了三款商品",
    taskText: "你要选购一台笔记本电脑，用于上课、写作业与数据分析，请查看智能体推荐结果。",
    productCount: 3,
    firstProduct: "名称：笔记本 A",
  },
  6: {
    remind: 0,
    scope: 1,
    goods: 2,
    remindText: "以下为您筛选了三款商品",
    taskText: "你要选购适配 14 英寸笔记本的电脑包，日常背着往返教室、图书馆。请查看智能体推荐结果。",
    productCount: 3,
    firstProduct: "名称：电脑包 A",
  },
  7: {
    remind: 0,
    scope: 2,
    goods: 1,
    remindText: "以下为您筛选了三款商品",
    taskText: "你要选购一台笔记本电脑，用于上课、写作业与数据分析，请查看智能体推荐结果。",
    productCount: 3,
    firstProduct: "名称：笔记本 A",
  },
  8: {
    remind: 0,
    scope: 2,
    goods: 2,
    remindText: "以下为您筛选了三款商品",
    taskText: "你要选购适配 14 英寸笔记本的电脑包，日常背着往返教室、图书馆。请查看智能体推荐结果。",
    productCount: 3,
    firstProduct: "名称：电脑包 A",
  },
};

test.describe("八组页面分支与材料", () => {
  test.describe.configure({ mode: "serial" });
  const sessionIds: string[] = [];

  test.afterEach(async () => {
    await cleanupSessions(sessionIds.splice(0));
  });

  for (let groupId = 1; groupId <= 8; groupId += 1) {
    test(`组 ${groupId} 的页面与商品材料正确`, async ({ page }) => {
      const expected = EXPECTATIONS[groupId];
      if (!expected) throw new Error(`缺少组 ${groupId} 的预期`);
      const sessionId = await createPreviewSession(page, groupId);
      sessionIds.push(sessionId);

      await expect(
        page.getByText("【三天内的会话】", { exact: true })
      ).toBeVisible();
      await page.getByRole("button", { name: "下一步", exact: true }).click();

      if (expected.remind === 1) {
        await expect(page).toHaveURL(/\/permission$/);
        await expect(
          page.getByText(expected.permissionText!, { exact: true })
        ).toBeVisible();
        await page.getByRole("button", { name: "下一步", exact: true }).click();
      } else {
        await expect(page).toHaveURL(/\/task$/);
        await expect(page.getByText("AI 读取权限设置")).toHaveCount(0);
      }

      await expect(page).toHaveURL(/\/task$/);
      await expect(page.getByText(expected.taskText, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "查看推荐" }).click();

      await expect(page).toHaveURL(/\/recommend$/);
      await expect(page.getByText(expected.remindText)).toBeVisible();
      await expect(page.locator(".product-card")).toHaveCount(3);
      await expect(page.getByText(expected.firstProduct, { exact: true })).toBeVisible();

      await page.getByRole("button", { name: "前往问卷填写" }).click();
      await expect(page).toHaveURL(/\/questionnaire$/);
      await fillAndSubmit(page);

      const result = await pool.query(
        "SELECT group_id, remind, scope, goods, permission_page_shown, collection_phase, q01, q09, q14 FROM submissions WHERE session_id = $1",
        [sessionId]
      );
      expect(result.rowCount).toBe(1);
      expect(result.rows[0]).toMatchObject({
        group_id: groupId,
        remind: expected.remind,
        scope: expected.scope,
        goods: expected.goods,
        permission_page_shown: expected.remind === 1,
        collection_phase: "dev",
        q01: 3,
        q09: 3,
        q14: 3,
      });
    });
  }
});
