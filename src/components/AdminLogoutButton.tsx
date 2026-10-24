"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function AdminLogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };
  return (
    <button type="button" className="btn-ghost" onClick={logout}>
      <LogOut size={16} aria-hidden />
      <span>退出登录</span>
    </button>
  );
}
