import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPool } from "@/lib/db";
import { ADMIN_COOKIE, createAdminSessionToken } from "@/lib/admin-auth";
import { loginBodySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = loginBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "请输入管理员账号和密码。" },
      { status: 400 }
    );
  }

  const result = await getPool().query(
    "SELECT username, password_hash FROM admin_users WHERE username = $1",
    [parsed.data.username]
  );
  const user = result.rows[0] as
    | { username: string; password_hash: string }
    | undefined;
  const valid = user
    ? await bcrypt.compare(parsed.data.password, user.password_hash)
    : false;
  if (!user || !valid) {
    return NextResponse.json(
      { ok: false, error: "账号或密码不正确。" },
      { status: 401 }
    );
  }

  const token = await createAdminSessionToken(user.username);
  const response = NextResponse.json({ ok: true, nextUrl: "/admin" });
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
