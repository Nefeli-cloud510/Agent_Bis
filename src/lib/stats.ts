import { ALL_QUESTION_IDS, QUESTIONNAIRE_CONTENT } from "@/config/content";

export type QuestionStat = {
  questionId: string;
  text: string;
  total: number;
  valid: number;
  missing: number;
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  mean: number | null;
  stddev: number | null;
};

const QUESTION_TEXT = new Map<string, string>();
for (const section of QUESTIONNAIRE_CONTENT.sections) {
  for (const question of section.questions) {
    QUESTION_TEXT.set(question.id, question.text);
  }
}

export function computeQuestionStats(
  rows: Array<Record<string, unknown>>
): QuestionStat[] {
  return ALL_QUESTION_IDS.map((questionId) => {
    const values: number[] = [];
    const counts: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };
    for (const row of rows) {
      const value = row[questionId];
      if (typeof value === "number") {
        values.push(value);
        const typed = value as 1 | 2 | 3 | 4 | 5;
        if (typed >= 1 && typed <= 5) counts[typed] += 1;
      }
    }
    const total = rows.length;
    const valid = values.length;
    const missing = total - valid;
    const meanRow = valid > 0 ? values.reduce((a, b) => a + b, 0) / valid : null;
    const variance =
      valid > 0
        ? values.reduce((sum, value) => sum + (value - meanRow!) ** 2, 0) /
          Math.max(valid - 1, 1)
        : null;
    return {
      questionId,
      text: QUESTION_TEXT.get(questionId) ?? questionId,
      total,
      valid,
      missing,
      counts,
      mean: meanRow == null ? null : Number(meanRow.toFixed(3)),
      stddev: variance == null ? null : Number(Math.sqrt(variance).toFixed(3)),
    };
  });
}
