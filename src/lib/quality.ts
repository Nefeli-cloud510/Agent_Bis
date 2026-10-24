export type TimingInput = {
  consent_active_ms?: number;
  history_active_ms?: number;
  permission_active_ms?: number | null;
  task_active_ms?: number;
  recommendation_active_ms?: number;
  questionnaire_active_ms?: number;
};

export function computeSubmissionFields(
  timings: TimingInput | undefined,
  permissionPageShown: boolean
) {
  const clean = {
    consent_active_ms: timings?.consent_active_ms ?? 0,
    history_active_ms: timings?.history_active_ms ?? 0,
    permission_active_ms: permissionPageShown
      ? (timings?.permission_active_ms ?? 0)
      : null,
    task_active_ms: timings?.task_active_ms ?? 0,
    recommendation_active_ms: timings?.recommendation_active_ms ?? 0,
    questionnaire_active_ms: timings?.questionnaire_active_ms ?? 0,
  };
  const values = Object.values(clean).filter(
    (value): value is number => typeof value === "number"
  );
  const total = values.reduce((sum, value) => sum + value, 0);
  return { ...clean, total_active_ms: total };
}

export function computeQualityFlags(input: {
  answers: Record<string, number>;
  totalActiveMs: number;
  permissionPageShown: boolean;
  permissionActiveMs: number | null;
  timingsProvided: boolean;
}): string[] {
  const flags: string[] = [];
  if (!input.timingsProvided) flags.push("activity_data_missing");
  if (input.totalActiveMs < 15_000) flags.push("very_fast_submission");
  if (input.totalActiveMs > 4 * 60 * 60 * 1000) flags.push("extreme_total_duration");
  if (
    input.permissionPageShown &&
    input.permissionActiveMs !== null &&
    input.permissionActiveMs < 500
  ) {
    flags.push("permission_page_below_500ms");
  }
  const answers = Object.values(input.answers);
  if (answers.length > 0 && answers.every((value) => value === answers[0])) {
    flags.push("uniform_answers");
  }
  return flags;
}
