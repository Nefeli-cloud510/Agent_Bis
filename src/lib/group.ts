import { GROUP_MAP, GROUP_IDS } from "@/config/content";

export function getGroupAssignment(groupId: number): {
  reminder: 0 | 1;
  scope: 1 | 2;
  goods: 1 | 2;
} {
  const numeric = Number(groupId);
  if (!GROUP_IDS.includes(numeric as (typeof GROUP_IDS)[number])) {
    throw new Error(`无效的组别编号: ${groupId}`);
  }
  const assignment = GROUP_MAP[numeric as (typeof GROUP_IDS)[number]];
  return {
    reminder: assignment.remind,
    scope: assignment.scope,
    goods: assignment.goods,
  };
}

export function randomGroup(): number {
  return GROUP_IDS[Math.floor(Math.random() * GROUP_IDS.length)];
}
