import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPool } from "@/lib/db";
import {
  SESSION_COOKIE,
  deleteSession,
  findSessionByToken,
} from "@/lib/session";

const CLEAR_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 0,
};

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const session = await findSessionByToken(token);
    if (session) {
      const submitted = await getPool().query(
        "SELECT 1 FROM submissions WHERE session_id = $1 LIMIT 1",
        [session.id]
      );
      if (!submitted.rowCount || submitted.rowCount === 0) {
        await deleteSession(session.id);
      }
    }
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "", CLEAR_COOKIE);
  return response;
}
