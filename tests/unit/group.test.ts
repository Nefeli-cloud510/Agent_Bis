import { describe, expect, it } from "vitest";
import {
  GROUP_IDS,
  GROUP_MAP,
  MATERIAL_VERSION,
} from "@/config/content";
import { getGroupAssignment, randomGroup } from "@/lib/group";

describe("eight group mapping", () => {
  it("matches the flow document mapping exactly", () => {
    expect(GROUP_IDS).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(GROUP_MAP).toEqual({
      1: { remind: 1, scope: 1, goods: 1 },
      2: { remind: 1, scope: 1, goods: 2 },
      3: { remind: 1, scope: 2, goods: 1 },
      4: { remind: 1, scope: 2, goods: 2 },
      5: { remind: 0, scope: 1, goods: 1 },
      6: { remind: 0, scope: 1, goods: 2 },
      7: { remind: 0, scope: 2, goods: 1 },
      8: { remind: 0, scope: 2, goods: 2 },
    });
  });

  it("derives the same fields from group ids", () => {
    for (const groupId of GROUP_IDS) {
      const assignment = getGroupAssignment(groupId);
      expect(assignment.reminder).toBe(GROUP_MAP[groupId].remind);
      expect(assignment.scope).toBe(GROUP_MAP[groupId].scope);
      expect(assignment.goods).toBe(GROUP_MAP[groupId].goods);
    }
    expect(() => getGroupAssignment(0)).toThrow();
    expect(() => getGroupAssignment(9)).toThrow();
  });

  it("random group stays in 1..8", () => {
    for (let index = 0; index < 200; index += 1) {
      expect(GROUP_IDS).toContain(randomGroup());
    }
  });

  it("exposes the fixed material version", () => {
    expect(MATERIAL_VERSION).toBe("flow-v1");
  });
});
