import { describe, expect, it } from "vitest";
import { computeQuestionStats } from "@/lib/stats";

describe("question statistics", () => {
  it("counts valid, missing and 1..5 distribution with mean/sd", () => {
    const stats = computeQuestionStats([
      { q01: 2, q02: null },
      { q01: 4 },
      { q01: 4, q02: 5 },
    ]);
    const q01 = stats.find((stat) => stat.questionId === "q01");
    const q02 = stats.find((stat) => stat.questionId === "q02");
    expect(q01?.valid).toBe(3);
    expect(q01?.missing).toBe(0);
    expect(q01?.counts).toEqual({ 1: 0, 2: 1, 3: 0, 4: 2, 5: 0 });
    expect(q01?.mean).toBeCloseTo(3.333, 2);
    expect(q01?.stddev).toBeCloseTo(1.155, 2);
    expect(q02?.valid).toBe(1);
    expect(q02?.missing).toBe(2);
  });

  it("reports 15 rows in fixed order", () => {
    const stats = computeQuestionStats([
      { q01: 1, q02: 2, q03: 3, q04: 4, q05: 5 },
    ]);
    expect(stats).toHaveLength(15);
    expect(stats[0].questionId).toBe("q01");
    expect(stats[14].questionId).toBe("q15");
  });
});
