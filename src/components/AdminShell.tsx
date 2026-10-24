import type { ReactNode } from "react";
import { Bot } from "lucide-react";
import AdminLogoutButton from "./AdminLogoutButton";

export default function AdminShell({
  username,
  children,
}: {
  username: string;
  children: ReactNode;
}) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="brand-mark" aria-hidden>
            <Bot size={18} />
          </span>
          <div className="admin-header-copy">
            <strong>购物体验研究 · 管理后台</strong>
            <span>研究数据只读展示与导出</span>
          </div>
        </div>
        <div className="admin-header-right">
          <span className="admin-username">{username}</span>
          <AdminLogoutButton />
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
