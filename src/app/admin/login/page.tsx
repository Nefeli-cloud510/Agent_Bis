import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/AdminLoginForm";
import { getAdminUsername } from "@/lib/admin-guard";

export const instant = false;

export default async function AdminLoginPage() {
  if (await getAdminUsername()) redirect("/admin");
  return <AdminLoginForm />;
}
