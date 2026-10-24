import { describe, expect, it } from "vitest";
import { ALL_QUESTION_IDS } from "@/config/content";
import { submitBodySchema } from "@/lib/validation";

function validAnswers(): Record<string, number> {
  return Object.fromEntries(
    ALL_QUESTION_IDS.map((questionId, index) => [
      questionId,
      (index % 5) + 1,
    ])
  );
}

function validBody(overrides: Record<string, unknown> = {}) {
  return {
    answers: validAnswers(),
    timings: {
      consent_active_ms: 3000,
      history_active_ms: 2000,
      permission_active_ms: null,
      task_active_ms: 1000,
      recommendation_active_ms: 2000,
      questionnaire_active_ms: 4000,
    },
    pageVisits: [{ page: "consent", activeMs: 3000 }],
    ...overrides,
  };
}

describe("submit body validation", () => {
  it("accepts a complete payload with 1..5 integers", () => {
    expect(submitBodySchema.safeParse(validBody()).success).toBe(true);
  });

  it("rejects values outside 1..5", () => {
    const body = validBody();
    body.answers.q01 = 6;
    expect(submitBodySchema.safeParse(body).success).toBe(false);
    body.answers.q01 = 0;
    expect(submitBodySchema.safeParse(body).success).toBe(false);
  });

  it("rejects missing or extra answer keys", () => {
    const missing = validBody();
    delete missing.answers.q15;
    expect(submitBodySchema.safeParse(missing).success).toBe(false);

    const extra = validBody();
    extra.answers.q99 = 3;
    expect(submitBodySchema.safeParse(extra).success).toBe(false);
  });

  it("rejects non-integer and negative timing values", () => {
    expect(
      submitBodySchema.safeParse(
        validBody({ timings: { consent_active_ms: 1.5 } })
      ).success
    ).toBe(false);
    expect(
      submitBodySchema.safeParse(
        validBody({ timings: { consent_active_ms: -1 } })
      ).success
    ).toBe(false);
  });
});
