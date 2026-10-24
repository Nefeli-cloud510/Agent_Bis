import { describe, expect, it } from "vitest";
import {
  computeQualityFlags,
  computeSubmissionFields,
} from "@/lib/quality";

describe("submission timings", () => {
  it("stores null permission time for remind=0 groups", () => {
    const fields = computeSubmissionFields(
      { consent_active_ms: 1000, permission_active_ms: 500 },
      false
    );
    expect(fields.permission_active_ms).toBeNull();
    expect(fields.total_active_ms).toBe(1000);
  });

  it("stores zero permission time only when the page was shown", () => {
    const fields = computeSubmissionFields(
      { consent_active_ms: 1000, permission_active_ms: undefined },
      true
    );
    expect(fields.permission_active_ms).toBe(0);
    expect(fields.total_active_ms).toBe(1000);
  });
});

describe("quality flags", () => {
  const answers = {
    q01: 3,
    q02: 3,
    q03: 3,
    q04: 3,
    q05: 3,
    q06: 3,
    q07: 3,
    q08: 3,
    q09: 3,
    q10: 3,
    q11: 3,
    q12: 3,
    q13: 3,
    q14: 3,
    q15: 3,
  };

  it("flags uniform answers and short activity without dropping data", () => {
    const flags = computeQualityFlags({
      answers,
      totalActiveMs: 4000,
      permissionPageShown: false,
      permissionActiveMs: null,
      timingsProvided: true,
    });
    expect(flags).toContain("uniform_answers");
    expect(flags).toContain("very_fast_submission");
    expect(flags).not.toContain("activity_data_missing");
  });

  it("only flags permission time when the page was shown", () => {
    const flags = computeQualityFlags({
      answers,
      totalActiveMs: 20_000,
      permissionPageShown: true,
      permissionActiveMs: 200,
      timingsProvided: true,
    });
    expect(flags).toContain("permission_page_below_500ms");

    const hidden = computeQualityFlags({
      answers,
      totalActiveMs: 20_000,
      permissionPageShown: false,
      permissionActiveMs: null,
      timingsProvided: true,
    });
    expect(hidden).not.toContain("permission_page_below_500ms");
  });
});
