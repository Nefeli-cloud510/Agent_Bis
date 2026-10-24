import { SignJWT, jwtVerify } from "jose";
import { getAppSecret } from "./env";

export const ADMIN_COOKIE = "ds_admin";

export type AdminPayload = {
  sub: string;
  role: "admin";
};

export async function createAdminSessionToken(username: string): Promise<string> {
  const secret = new TextEncoder().encode(getAppSecret());
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(username)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
}

export async function verifyAdminSessionToken(
  token: string | undefined
): Promise<AdminPayload | null> {
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(getAppSecret());
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "admin" || !payload.sub) return null;
    return { sub: payload.sub, role: "admin" };
  } catch {
    return null;
  }
}
