import {
  ALL_QUESTION_IDS,
  GROUP_IDS,
  GROUP_MAP,
  MATERIAL_VERSION,
  QUESTIONNAIRE_CONTENT,
  QUESTIONNAIRE_VERSION,
} from "@/config/content";
import { getPool } from "./db";
import { computeQuestionStats } from "./stats";

export type AdminFilters = {
  collection_phase?: string;
  material_version?: string;
  group_id?: number;
  remind?: number;
  scope?: number;
  goods?: number;
};

export type SubmissionDetail = {
  id: string;
  participant_id: string;
  session_id: string;
  group_id: number;
  remind: number;
  scope: number;
  goods: number;
  permission_page_shown: boolean;
  material_version: string;
  questionnaire_version: string;
  collection_phase: "dev" | "pilot" | "formal";
  submitted_at: string | Date | null;
  total_active_ms: number;
  consent_active_ms: number | null;
  history_active_ms: number | null;
  permission_active_ms: number | null;
  task_active_ms: number | null;
  recommendation_active_ms: number | null;
  questionnaire_active_ms: number | null;
  page_visits: Array<Record<string, unknown>>;
  quality_flags: string[];
} & Record<(typeof ALL_QUESTION_IDS)[number], number>;

export const SUBMISSION_EXPORT_COLUMNS = [
  "participant_id",
  "group_id",
  "remind",
  "scope",
  "goods",
  "permission_page_shown",
  "material_version",
  "questionnaire_version",
  "collection_phase",
  "submitted_at",
  "total_active_ms",
  "consent_active_ms",
  "history_active_ms",
  "permission_active_ms",
  "task_active_ms",
  "recommendation_active_ms",
  "questionnaire_active_ms",
  "page_visits",
  "quality_flags",
  ...ALL_QUESTION_IDS,
] as const;

export function toAdminFilters(
  searchParams: Record<string, string | string[] | undefined>
): AdminFilters {
  const single = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const phase = single("phase");
  const version = single("version");
  const group = Number(single("group"));
  const remind = single("remind");
  const scope = single("scope");
  const goods = single("goods");
  return {
    collection_phase:
      phase === "dev" || phase === "pilot" || phase === "formal"
        ? phase
        : undefined,
    material_version: version ? version : undefined,
    group_id: Number.isInteger(group) && group >= 1 && group <= 8 ? group : undefined,
    remind: remind === "0" || remind === "1" ? Number(remind) : undefined,
    scope: scope === "1" || scope === "2" ? Number(scope) : undefined,
    goods: goods === "1" || goods === "2" ? Number(goods) : undefined,
  };
}

export function buildWhereSql(
  filters: AdminFilters
): { where: string; params: unknown[] } {
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters.collection_phase) {
    params.push(filters.collection_phase);
    clauses.push(`collection_phase = $${params.length}`);
  }
  if (filters.material_version) {
    params.push(filters.material_version);
    clauses.push(`material_version = $${params.length}`);
  }
  if (filters.group_id !== undefined) {
    params.push(filters.group_id);
    clauses.push(`group_id = $${params.length}`);
  }
  if (filters.remind !== undefined) {
    params.push(filters.remind);
    clauses.push(`remind = $${params.length}`);
  }
  if (filters.scope !== undefined) {
    params.push(filters.scope);
    clauses.push(`scope = $${params.length}`);
  }
  if (filters.goods !== undefined) {
    params.push(filters.goods);
    clauses.push(`goods = $${params.length}`);
  }
  return {
    where: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export async function getOverview(filters: AdminFilters) {
  const { where, params } = buildWhereSql(filters);
  const totalResult = await getPool().query(
    `SELECT count(*)::int AS total, max(submitted_at) AS last_submitted_at
     FROM submissions ${where}`,
    params
  );
  const groupResult = await getPool().query(
    `SELECT group_id, count(*)::int AS count
     FROM submissions ${where}
     GROUP BY group_id
     ORDER BY group_id`,
    params
  );
  const phaseResult = await getPool().query(
    `SELECT DISTINCT collection_phase FROM submissions ORDER BY collection_phase`
  );
  const versionResult = await getPool().query(
    `SELECT DISTINCT material_version FROM submissions ORDER BY material_version`
  );
  const groupCounts = new Map<number, number>(
    groupResult.rows.map((row) => [row.group_id as number, row.count as number])
  );
  const groups = GROUP_IDS.map((groupId) => ({
    group_id: groupId,
    assignment: GROUP_MAP[groupId],
    count: groupCounts.get(groupId) ?? 0,
  }));
  return {
    total: (totalResult.rows[0]?.total as number) ?? 0,
    lastSubmittedAt: (totalResult.rows[0]?.last_submitted_at as
      | string
      | Date
      | null) ?? null,
    groups,
    phases: phaseResult.rows.map((row) => row.collection_phase as string),
    versions: versionResult.rows.map((row) => row.material_version as string),
  };
}

export async function getQuestionStats(filters: AdminFilters) {
  const { where, params } = buildWhereSql(filters);
  const result = await getPool().query(
    `SELECT q01, q02, q03, q04, q05, q06, q07, q08, q09, q10, q11, q12, q13,
            q14, q15
     FROM submissions ${where}`,
    params
  );
  return computeQuestionStats(
    result.rows as Array<Record<string, unknown>>
  );
}

export async function listSamples(
  filters: AdminFilters,
  limit = 100
) {
  const { where, params } = buildWhereSql(filters);
  const result = await getPool().query(
    `SELECT id, participant_id, group_id, collection_phase, material_version,
            questionnaire_version, submitted_at, total_active_ms, quality_flags
     FROM submissions ${where}
     ORDER BY submitted_at DESC
     LIMIT $${params.length + 1}`,
    [...params, limit]
  );
  return result.rows.map((row) => ({
    ...row,
    quality_flags: parseJsonArray<string>(row.quality_flags),
  }));
}

export async function getSampleById(
  id: string
): Promise<SubmissionDetail | null> {
  const result = await getPool().query(
    `SELECT * FROM submissions WHERE id = $1`,
    [id]
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...row,
    page_visits: parseJsonArray<Record<string, unknown>>(row.page_visits),
    quality_flags: parseJsonArray<string>(row.quality_flags),
  } as SubmissionDetail;
}

export async function getGroupSummaryRows(filters: AdminFilters) {
  const { where, params } = buildWhereSql(filters);
  const aggregates = ALL_QUESTION_IDS.map(
    (questionId) =>
      `avg(${questionId}) AS ${questionId}_mean, ` +
      `stddev_samp(${questionId}) AS ${questionId}_sd`
  ).join(", ");
  const result = await getPool().query(
    `SELECT group_id, count(*)::int AS n, ${aggregates}
     FROM submissions ${where}
     GROUP BY group_id
     ORDER BY group_id`,
    params
  );
  const byGroup = new Map<number, (typeof result.rows)[number]>(
    result.rows.map((row) => [row.group_id as number, row])
  );
  return GROUP_IDS.map((groupId) => {
    const row = byGroup.get(groupId) ?? {};
    const output: Record<string, string | number | null> = {
      group_id: groupId,
      remind: GROUP_MAP[groupId].remind,
      scope: GROUP_MAP[groupId].scope,
      goods: GROUP_MAP[groupId].goods,
      n: (row.n as number | undefined) ?? 0,
    };
    if (filters.collection_phase) output.collection_phase = filters.collection_phase;
    if (filters.material_version) output.material_version = filters.material_version;
    for (const questionId of ALL_QUESTION_IDS) {
      output[`${questionId}_mean`] = roundNullable(row[`${questionId}_mean`]);
      output[`${questionId}_sd`] = roundNullable(row[`${questionId}_sd`]);
    }
    return output;
  });
}

export function variableDictionaryRows() {
  const questionLookup = new Map<string, string>();
  for (const section of QUESTIONNAIRE_CONTENT.sections) {
    for (const question of section.questions) {
      questionLookup.set(question.id, question.text);
    }
  }
  const rows: Array<Record<string, string | number>> = [
    {
      field: "participant_id",
      type: "文本",
      encoding: "匿名参与者编号，P- 前缀",
      missing: "提交必有",
      note: "服务端生成，不包含真实身份信息",
    },
    {
      field: "group_id",
      type: "整数 1-8",
      encoding: "固定八组编号",
      missing: "提交必有",
      note: groupMappingText(),
    },
    {
      field: "remind / scope / goods",
      type: "整数",
      encoding: "remind 0/1；scope 1/2；goods 1/2",
      missing: "提交必有",
      note: "与 group_id 必须匹配固定映射",
    },
    {
      field: "permission_page_shown",
      type: "布尔",
      encoding: "true=提醒组显示权限页；false=无提醒组",
      missing: "提交必有",
      note: "无提醒组恒为 false",
    },
    {
      field: "material_version / questionnaire_version",
      type: "文本版本号",
      encoding: `${MATERIAL_VERSION} / ${QUESTIONNAIRE_VERSION}`,
      missing: "提交必有",
      note: "材料与问卷版本，历史记录按版本保留",
    },
    {
      field: "collection_phase",
      type: "文本",
      encoding: "dev / pilot / formal",
      missing: "提交必有",
      note: "开发测试、预实验、正式实验分离",
    },
    {
      field: "submitted_at",
      type: "时间戳",
      encoding: "ISO 8601，UTC",
      missing: "提交必有",
      note: "服务端写入时间",
    },
    {
      field: "*_active_ms",
      type: "整数毫秒",
      encoding: "页面可见且窗口聚焦时累计；隐藏标签页暂停",
      missing: "permission_active_ms 在无提醒组为 NULL",
      note: "不等于认真阅读时间",
    },
    {
      field: "total_active_ms",
      type: "整数毫秒",
      encoding: "各页面 active_ms 之和",
      missing: "提交必有",
      note: "仅作质量提示，不自动剔除",
    },
    {
      field: "page_visits",
      type: "JSON 数组",
      encoding: "页面路径、进入/离开时间与 activeMs",
      missing: "可为空数组",
      note: "仅随正式提交保存",
    },
    {
      field: "quality_flags",
      type: "JSON 数组",
      encoding: "活动数据缺失、极快/极长、统一答案等",
      missing: "可为空数组",
      note: "仅提示，不自动修改或剔除",
    },
    ...ALL_QUESTION_IDS.map((questionId) => ({
      field: questionId,
      type: "整数 1-5",
      encoding:
        "1=非常不同意，2=不同意，3=中立，4=同意，5=非常同意",
      missing: "正式提交必有答案；统计缺少数通常为 0",
      note: questionLookup.get(questionId) ?? questionId,
    })),
  ];
  return rows;
}

function groupMappingText(): string {
  return GROUP_IDS.map(
    (groupId) =>
      `组${groupId}：remind=${GROUP_MAP[groupId].remind}，` +
      `scope=${GROUP_MAP[groupId].scope}，goods=${GROUP_MAP[groupId].goods}`
  ).join("；");
}

function parseJsonArray<T>(value: unknown): T[] {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T[];
    } catch {
      return [];
    }
  }
  return Array.isArray(value) ? (value as T[]) : [];
}

function roundNullable(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Number(value.toFixed(3));
}
