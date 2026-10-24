import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  verifyAdminSessionToken,
} from "./admin-auth";

export async function getAdminUsername(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  const payload = await verifyAdminSessionToken(token);
  return payload?.sub ?? null;
}

export async function requireAdmin(): Promise<string> {
  const username = await getAdminUsername();
  if (!username) redirect("/admin/login");
  return username;
}

export async function requireAdminForApi(): Promise<string | null> {
  return getAdminUsername();
}
