import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { requireAdminForApi } from "@/lib/admin-guard";
import {
  SUBMISSION_EXPORT_COLUMNS,
  buildWhereSql,
  toAdminFilters,
} from "@/lib/admin-data";
import { toCsvWithHeaders } from "@/lib/csv";

export async function GET(request: Request) {
  if (!(await requireAdminForApi())) {
    return NextResponse.json(
      { ok: false, error: "需要管理员登录。" },
      { status: 401 }
    );
  }
  const url = new URL(request.url);
  const filters = toAdminFilters(Object.fromEntries(url.searchParams));
  const { where, params } = buildWhereSql(filters);
  const result = await getPool().query(
    `SELECT ${SUBMISSION_EXPORT_COLUMNS.join(", ")}
     FROM submissions ${where}
     ORDER BY submitted_at, participant_id`,
    params
  );
  const rows = result.rows.map((row) => {
    const output: Record<string, string | number | boolean | null> = {};
    for (const column of SUBMISSION_EXPORT_COLUMNS) {
      const value = row[column];
      if (column === "page_visits" || column === "quality_flags") {
        output[column] = JSON.stringify(value ?? []);
      } else {
        output[column] = (value as string | number | boolean | null) ?? null;
      }
    }
    return output;
  });

  return new NextResponse(toCsvWithHeaders(rows, SUBMISSION_EXPORT_COLUMNS), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        "attachment; filename=\"study_raw_data.csv\"; " +
        "filename*=UTF-8''study_raw_data.csv",
      "Cache-Control": "no-store",
    },
  });
}
