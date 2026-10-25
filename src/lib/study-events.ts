export const ACTIVITY_KEY = "ds_activity_v1";
export const VISITS_KEY = "ds_page_visits_v1";
export const ANSWERS_KEY = "ds_answers_v1";
export const CONSENT_KEY = "ds_consent_key_v1";
export const RECOMMENDATION_STATE_KEY = "ds_recommendation_state_v1";
export const RECOMMENDATION_LOGS_KEY = "ds_recommendation_logs_v1";
export const FLUSH_EVENT = "ds-study-flush";

export type ActivityPage =
  | "consent"
  | "history"
  | "permission"
  | "task"
  | "recommendation"
  | "questionnaire"
  | "done"
  | "exited";

export type ActivityMap = Partial<
  Record<ActivityPage, { activeMs: number; enteredAt?: string }>
>;

export type PageVisit = {
  page: ActivityPage;
  enteredAt?: string;
  leftAt?: string;
  activeMs: number;
};

export type StudyPayload = {
  timings: {
    consent_active_ms?: number;
    history_active_ms?: number;
    permission_active_ms?: number | null;
    task_active_ms?: number;
    recommendation_active_ms?: number;
    questionnaire_active_ms?: number;
  };
  pageVisits: PageVisit[];
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function readStoredJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStoredJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 存储不可用时不阻断实验流程
  }
}

export function readActivity(): ActivityMap {
  return readStoredJson<ActivityMap>(ACTIVITY_KEY, {});
}

export function saveActivity(activity: ActivityMap): void {
  writeStoredJson(ACTIVITY_KEY, activity);
}

export function readVisits(): PageVisit[] {
  return readStoredJson<PageVisit[]>(VISITS_KEY, []);
}

export function saveVisits(visits: PageVisit[]): void {
  writeStoredJson(VISITS_KEY, visits.slice(-300));
}

export function readAnswers(): Record<string, string> {
  return readStoredJson<Record<string, string>>(ANSWERS_KEY, {});
}

export function saveAnswers(answers: Record<string, string>): void {
  writeStoredJson(ANSWERS_KEY, answers);
}

export function clearStudyStorage(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(ACTIVITY_KEY);
    sessionStorage.removeItem(VISITS_KEY);
    sessionStorage.removeItem(ANSWERS_KEY);
    sessionStorage.removeItem(CONSENT_KEY);
    sessionStorage.removeItem(RECOMMENDATION_STATE_KEY);
    sessionStorage.removeItem(RECOMMENDATION_LOGS_KEY);
  } catch {
    // 清理失败不阻断流程
  }
}

export type RecommendationLogEvent = {
  event: "task_sent" | "assistant_reply_shown" | "questionnaire_started";
  timestamp: string;
};

export type RecommendationState = {
  taskSentAt?: string;
  replyShownAt?: string;
};

export function readRecommendationState(): RecommendationState {
  const stored = readStoredJson<RecommendationState>(
    RECOMMENDATION_STATE_KEY,
    {}
  );
  if (stored.taskSentAt || stored.replyShownAt) return stored;
  // 兼容旧版把状态写入日志键的临时实现。
  const legacy = readStoredJson<RecommendationState>(
    RECOMMENDATION_LOGS_KEY,
    {}
  );
  return legacy.taskSentAt || legacy.replyShownAt ? legacy : {};
}

export function saveRecommendationState(state: RecommendationState): void {
  writeStoredJson(RECOMMENDATION_STATE_KEY, {
    taskSentAt: state.taskSentAt,
    replyShownAt: state.replyShownAt,
  });
}

export function readRecommendationLogs(): RecommendationLogEvent[] {
  return readStoredJson<RecommendationLogEvent[]>(RECOMMENDATION_LOGS_KEY, []);
}

export function saveRecommendationLogs(
  logs: RecommendationLogEvent[]
): void {
  writeStoredJson(RECOMMENDATION_LOGS_KEY, logs.slice(-50));
}

export function clearRecommendationLogs(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem(RECOMMENDATION_LOGS_KEY);
  } catch {
    // 清理失败不阻断流程
  }
}

export function getConsentKey(): string | null {
  if (!isBrowser()) return null;
  try {
    return sessionStorage.getItem(CONSENT_KEY);
  } catch {
    return null;
  }
}

export function persistConsentKey(key: string): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem(CONSENT_KEY, key);
  } catch {
    // 存储不可用时不阻断实验流程
  }
}

export function flushActivityNow(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(FLUSH_EVENT, { detail: { force: true } }));
}

const TIMING_KEYS: Partial<Record<ActivityPage, keyof StudyPayload["timings"]>> = {
  consent: "consent_active_ms",
  history: "history_active_ms",
  permission: "permission_active_ms",
  task: "task_active_ms",
  recommendation: "recommendation_active_ms",
  questionnaire: "questionnaire_active_ms",
};

export function buildStudyPayload(): StudyPayload {
  const activity = readActivity();
  const visits = readVisits();
  const timings: StudyPayload["timings"] = {
    consent_active_ms: 0,
    history_active_ms: 0,
    permission_active_ms: 0,
    task_active_ms: 0,
    recommendation_active_ms: 0,
    questionnaire_active_ms: 0,
  };
  for (const [page, bucket] of Object.entries(activity) as Array<
    [ActivityPage, { activeMs: number } | undefined]
  >) {
    const key = TIMING_KEYS[page];
    if (key && typeof bucket?.activeMs === "number") {
      const value = (timings[key] ?? 0) as number;
      timings[key] = Number((value + bucket.activeMs).toFixed(0));
    }
  }
  return { timings, pageVisits: visits.slice(-300) };
}
