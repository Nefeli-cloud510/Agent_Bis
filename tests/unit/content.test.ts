import { describe, expect, it } from "vitest";
import {
  ALL_QUESTION_IDS,
  CONSENT_CONTENT,
  END_CONTENT,
  HISTORY_CONTENT,
  PERMISSION_CONTENT,
  QUESTIONNAIRE_CONTENT,
  RECOMMENDATION_CONTENT,
  TASK_CONTENT,
} from "@/config/content";

describe("flow document content", () => {
  it("keeps consent text and button verbatim", () => {
    expect(CONSENT_CONTENT.title).toBe("实验知情同意书");
    expect(CONSENT_CONTENT.paragraphs).toEqual([
      "您好！我们正在进行一项关于购物智能体商品推荐的学术实验，全程大约 3-5 分钟。",
      "1. 本实验仅用于课程学术研究，所有数据匿名收集，不会泄露你的个人信息；",
      "2. 你可以随时退出实验，退出后你的数据不会被记录；",
      "3. 完成全部问卷即视为同意参与本次实验。",
    ]);
    expect(CONSENT_CONTENT.button).toBe("我已阅读并同意，开始实验");
  });

  it("keeps both simulated history sections verbatim", () => {
    expect(HISTORY_CONTENT.title).toBe("与智能体历史聊天记录（模拟）");
    expect(HISTORY_CONTENT.sections[0].heading).toBe("【三天内的会话】");
    expect(HISTORY_CONTENT.sections[0].messages).toHaveLength(3);
    expect(HISTORY_CONTENT.sections[1].heading).toBe(
      "【三个月内的会话（系统可以读取）】"
    );
    expect(HISTORY_CONTENT.sections[1].messages).toHaveLength(4);
    expect(HISTORY_CONTENT.note).toBe("备注：以上对话纯属虚构。");
    expect(HISTORY_CONTENT.button).toBe("下一步");
  });

  it("keeps permission and task text verbatim", () => {
    expect(PERMISSION_CONTENT[1].text).toBe(
      "本次推荐，AI 只能看到【最近一次会话】内容，看不到更早记录。"
    );
    expect(PERMISSION_CONTENT[2].text).toBe(
      "本次推荐，AI 可以看到上方【最近一次会话】+【更早的会话】全部内容。"
    );
    expect(TASK_CONTENT[1].text).toBe(
      "你要选购一台笔记本电脑，用于上课、写作业与数据分析，请查看智能体推荐结果。"
    );
    expect(TASK_CONTENT[2].text).toBe(
      "你要选购适配 14 英寸笔记本的电脑包，日常背着往返教室、图书馆。请查看智能体推荐结果。"
    );
  });

  it("keeps remind row and all six products verbatim in fixed order", () => {
    expect(RECOMMENDATION_CONTENT.remindText[0]).toBe(
      "以下为您筛选了三款商品，您可以查看商品信息后决定是否采纳。"
    );
    expect(RECOMMENDATION_CONTENT.remindText[1]).toBe(
      "本次筛选参考了你聊天中的展示使用习惯与偏好，您可以查看商品信息后决定是否采纳。"
    );
    expect(
      RECOMMENDATION_CONTENT.goods[1].items.map((item) => item.name)
    ).toEqual(["名称：笔记本 A", "名称：笔记本 B", "名称：笔记本 C"]);
    expect(
      RECOMMENDATION_CONTENT.goods[2].items.map((item) => item.name)
    ).toEqual(["名称：电脑包 A", "名称：电脑包 B", "名称：电脑包 C"]);
    expect(RECOMMENDATION_CONTENT.goods[1].items[0].description).toContain(
      "14 英寸；机身 1.3kg"
    );
    expect(RECOMMENDATION_CONTENT.goods[2].items[2].description).toBe(
      "描述：很轻、简单基础款，性价比很高。"
    );
    expect(RECOMMENDATION_CONTENT.button).toBe("前往问卷填写");
  });

  it("keeps the conversational task and assistant opening texts", () => {
    expect(RECOMMENDATION_CONTENT.userMessage[1]).toBe(
      "你要选购一台笔记本电脑，用于上课、写作业与数据分析，请查看智能体推荐结果。"
    );
    expect(RECOMMENDATION_CONTENT.userMessage[2]).toBe(
      "你要选购适配 14 英寸笔记本的电脑包，日常背着往返教室、图书馆。请查看智能体推荐结果。"
    );
    expect(RECOMMENDATION_CONTENT.assistantOpening[1]).toBe(
      "好的，我整理了三款笔记本电脑供你比较。下面列出了它们的重量、续航和配置，你可以查看后决定是否采纳推荐。"
    );
    expect(RECOMMENDATION_CONTENT.assistantOpening[2]).toBe(
      "好的，我整理了三款电脑包供你比较。下面列出了它们的主要特点，你可以查看后决定是否采纳推荐。"
    );
    expect(RECOMMENDATION_CONTENT.typing).toBe("正在整理推荐…");
    expect(RECOMMENDATION_CONTENT.sendButton).toBe("发送");
  });

  it("keeps the 15 questionnaire items and 5-point labels verbatim", () => {
    expect(QUESTIONNAIRE_CONTENT.sections.map((section) => section.heading)).toEqual([
      "使用体验",
      "体验回顾",
      "日常使用",
    ]);
    const questions: Array<{ id: string; text: string }> = [];
    for (const section of QUESTIONNAIRE_CONTENT.sections) {
      for (const question of section.questions) {
        questions.push({ id: question.id, text: question.text });
      }
    }
    expect(questions).toHaveLength(15);
    expect(questions.map((question) => question.id)).toEqual(ALL_QUESTION_IDS);
    expect(questions[0].text).toBe("1. 我相信本次 AI 给出的商品推荐是可靠的");
    expect(questions[13].text).toBe("14. 你对笔记本电脑 / 电脑包很熟悉");
    expect(questions[14].text).toBe("15. 你平时使用 AI 助手的频率很高");
    expect(QUESTIONNAIRE_CONTENT.scaleLabels.map((item) => item.label)).toEqual([
      "非常不同意",
      "不同意",
      "中立",
      "同意",
      "非常同意",
    ]);
    expect(QUESTIONNAIRE_CONTENT.submitButton).toBe("提交");
    expect(END_CONTENT.title).toBe("感谢你完成本次实验！");
    expect(END_CONTENT.text).toBe("本次实验到此结束。");
  });
});
