import { NextResponse } from "next/server";
import { requireAdminForApi } from "@/lib/admin-guard";
import { variableDictionaryRows } from "@/lib/admin-data";
import { toCsvWithHeaders } from "@/lib/csv";

const COLUMNS = ["field", "type", "encoding", "missing", "note"] as const;

export async function GET() {
  if (!(await requireAdminForApi())) {
    return NextResponse.json(
      { ok: false, error: "需要管理员登录。" },
      { status: 401 }
    );
  }
  const rows = variableDictionaryRows();
  return new NextResponse(toCsvWithHeaders(rows, COLUMNS), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        "attachment; filename=\"study_variable_dictionary.csv\"; " +
        "filename*=UTF-8''study_variable_dictionary.csv",
      "Cache-Control": "no-store",
    },
  });
}
