export const MATERIAL_VERSION = "flow-v1";
export const QUESTIONNAIRE_VERSION = "flow-15-v1";

export const GROUP_MAP: Record<
  1 | 2 | 3 | 4 | 5 | 6 | 7 | 8,
  { remind: 0 | 1; scope: 1 | 2; goods: 1 | 2 }
> = {
  1: { remind: 1, scope: 1, goods: 1 },
  2: { remind: 1, scope: 1, goods: 2 },
  3: { remind: 1, scope: 2, goods: 1 },
  4: { remind: 1, scope: 2, goods: 2 },
  5: { remind: 0, scope: 1, goods: 1 },
  6: { remind: 0, scope: 1, goods: 2 },
  7: { remind: 0, scope: 2, goods: 1 },
  8: { remind: 0, scope: 2, goods: 2 },
};

export const GROUP_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const PUBLIC_PAGES = {
  consent: "/start",
  history: "/records",
  permission: "/permission",
  task: "/task",
  recommendation: "/recommend",
  questionnaire: "/questionnaire",
  done: "/done",
  exited: "/exited",
} as const;

export type PublicStep = keyof typeof PUBLIC_PAGES;

export const CONSENT_CONTENT = {
  title: "实验知情同意书",
  paragraphs: [
    "您好！我们正在进行一项关于购物智能体商品推荐的学术实验，全程大约 3-5 分钟。",
    "1. 本实验仅用于课程学术研究，所有数据匿名收集，不会泄露你的个人信息；",
    "2. 你可以随时退出实验，退出后你的数据不会被记录；",
    "3. 完成全部问卷即视为同意参与本次实验。",
  ],
  button: "我已阅读并同意，开始实验",
} as const;

export const HISTORY_CONTENT = {
  title: "与智能体历史聊天记录（模拟）",
  sections: [
    {
      heading: "【三天内的会话】",
      messages: [
        "现在地铁站好多高饱和广告，看着就心烦。",
        "最近天天往图书馆、机房跑，包里塞一堆东西，肩膀好酸，怎么缓解酸痛呢？",
        "这个月花太多钱在吃饭上了，生活费有些不够用。",
      ],
    },
    {
      heading: "【三个月内的会话（系统可以读取）】",
      messages: [
        "有没有低调简单、日常好搭的衣服呀，不要那种印花很多很花哨的。",
        "包要怎么搭衣服看起来更协调呢？",
        "信管专业入门有什么值得看的书吗，比如数据库或者c语言相关的。",
        "我平时基本不打游戏，空闲时候就喜欢看看剧。",
      ],
    },
  ],
  note: "备注：以上对话纯属虚构。",
  button: "下一步",
} as const;

export const PERMISSION_CONTENT: Record<
  1 | 2,
  { title: string; text: string; button: string }
> = {
  1: {
    title: "AI 读取权限设置",
    text: "本次推荐，AI 只能看到【最近一次会话】内容，看不到更早记录。",
    button: "下一步",
  },
  2: {
    title: "AI 读取权限设置",
    text: "本次推荐，AI 可以看到上方【最近一次会话】+【更早的会话】全部内容。",
    button: "下一步",
  },
};

export const TASK_CONTENT: Record<1 | 2, { title: string; text: string; button: string }> = {
  1: {
    title: "本次购物任务",
    text: "你要选购一台笔记本电脑，用于上课、写作业与数据分析，请查看智能体推荐结果。",
    button: "查看推荐",
  },
  2: {
    title: "本次购物任务",
    text: "你要选购适配 14 英寸笔记本的电脑包，日常背着往返教室、图书馆。请查看智能体推荐结果。",
    button: "查看推荐",
  },
};

export const RECOMMENDATION_CONTENT = {
  remindText: {
    0: "以下为您筛选了三款商品，您可以查看商品信息后决定是否采纳。",
    1: "本次筛选参考了你聊天中的展示使用习惯与偏好，您可以查看商品信息后决定是否采纳。",
  },
  goods: {
    1: {
      title: "笔记本电脑",
      items: [
        {
          name: "名称：笔记本 A",
          description:
            "描述：14 英寸；机身 1.3kg；76Wh 电池，连续视频 8h、重度算力 4h；双通道 16G 内存 + 512G 固态；CPU 多核 4.6GHz；色域 100% sRGB；PD 快充 65W；接口含 HDMI+USB-A×2；价格适中。",
        },
        {
          name: "名称：笔记本 B",
          description:
            "描述：16 英寸；机身 2.1kg；90Wh 电池，连续视频 10h、重度算力 5h；32G 内存 + 1T 固态；CPU 多核 5.2GHz；高刷 144Hz；RGB 背光键盘；价格偏高。",
        },
        {
          name: "名称：笔记本 C",
          description:
            "描述：13.3 英寸；机身 1.1kg；60Wh 电池，连续视频 7h、重度算力 3.5h；8G 内存 + 256G 固态；CPU 多核 4.2GHz；基础 45W 充电；无多余拓展接口；性价比高。",
        },
      ],
    },
    2: {
      title: "电脑包",
      items: [
        { name: "名称：电脑包 A", description: "描述：轻薄简约，基础防震，背着舒服，价格适中。" },
        { name: "名称：电脑包 B", description: "描述：容量大、防摔加厚，双肩款，价格偏高。" },
        { name: "名称：电脑包 C", description: "描述：很轻、简单基础款，性价比很高。" },
      ],
    },
  },
  button: "前往问卷填写",
} as const;

export const QUESTIONNAIRE_CONTENT = {
  instruction:
    "请根据刚才智能体推荐的感受作答，1 = 非常不同意，2 = 不同意，3 = 中立，4 = 同意，5 = 非常同意",
  scaleLabels: [
    { value: 1, label: "非常不同意" },
    { value: 2, label: "不同意" },
    { value: 3, label: "中立" },
    { value: 4, label: "同意" },
    { value: 5, label: "非常同意" },
  ],
  sections: [
    {
      heading: null,
      questions: [
        { id: "q01", text: "1. 我相信本次 AI 给出的商品推荐是可靠的" },
        { id: "q02", text: "2. 我认为本次 AI 推荐没有误导我" },
        { id: "q03", text: "3. 我会考虑购买本次 AI 推荐的商品" },
        { id: "q04", text: "4. 如果现实里有需求，我大概率会采纳这次的推荐" },
        { id: "q05", text: "5. 本次推荐充分考虑了我的使用需求" },
        { id: "q06", text: "6. AI 调取聊天历史做推荐，会带来隐私泄露风险" },
        { id: "q07", text: "7. 使用我的聊天历史来推荐商品，让我感到不安" },
      ],
    },
    {
      heading: "操纵检查",
      questions: [
        { id: "q08", text: "8.智能体推荐提示了参考你之前的聊天习惯" },
        { id: "q09", text: "9. 根据权限页面说明，系统能读取全部历史" },
        { id: "q10", text: "10. 刚刚看到的商品信息很复杂，需要对比很多参数" },
        { id: "q11", text: "11. 刚才的模拟聊天记录，和这次选购商品的任务是相关的" },
        { id: "q12", text: "12. 参考聊天记录，对我挑选这个商品有帮助" },
        { id: "q13", text: "13. 这次购买该商品对我个人的很重要" },
      ],
    },
    {
      heading: "控制变量",
      questions: [
        { id: "q14", text: "14. 你对笔记本电脑 / 电脑包很熟悉" },
        { id: "q15", text: "15. 你平时使用 AI 助手的频率很高" },
      ],
    },
  ],
  submitButton: "提交",
} as const;

export const END_CONTENT = {
  title: "感谢你完成本次实验！",
  text: "本次实验到此结束。",
} as const;

export const EXIT_CONTENT = {
  title: "已退出实验",
  text: "未提交的数据不会被记录。你可以随时关闭本页面。",
} as const;

export const ALL_QUESTION_IDS = Array.from({ length: 15 }, (_, index) => {
  const number = String(index + 1).padStart(2, "0");
  return `q${number}` as const;
});
