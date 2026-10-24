import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin-guard";
import {
  getGroupSummaryRows,
  toAdminFilters,
} from "@/lib/admin-data";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  if (!(await requireAdminForApi())) {
    return NextResponse.json(
      { ok: false, error: "需要管理员登录。" },
      { status: 401 }
    );
  }
  const url = new URL(request.url);
  const filters = toAdminFilters(Object.fromEntries(url.searchParams));
  const rows = await getGroupSummaryRows(filters);
  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        "attachment; filename=\"study_group_summary.csv\"; " +
        "filename*=UTF-8''study_group_summary.csv",
      "Cache-Control": "no-store",
    },
  });
}
