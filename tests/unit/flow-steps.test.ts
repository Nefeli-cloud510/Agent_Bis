import { describe, expect, it } from "vitest";
import { stepsForSession } from "@/lib/study-guard";
import { nextStepAfter } from "@/lib/session";

describe("unified flow for all groups", () => {
  it("shows the permission step in every group's progress", () => {
    const steps = stepsForSession().map((step) => step.id);
    expect(steps).toEqual([
      "consent",
      "history",
      "permission",
      "task",
      "recommendation",
      "questionnaire",
    ]);
  });

  it("advances history to permission regardless of remind", () => {
    expect(nextStepAfter("history")).toBe("permission");
    expect(nextStepAfter("permission")).toBe("task");
  });
});
