"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LoaderCircle } from "lucide-react";

export default function AdminLoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        nextUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "登录失败，请重试。");
        return;
      }
      router.push(data.nextUrl ?? "/admin");
    } catch {
      setError("登录请求未送达，请检查网络后重试。");
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="login-box" onSubmit={submit}>
      <h1 className="admin-title">管理后台登录</h1>
      <label>
        管理员账号
        <input name="username" autoComplete="username" required />
      </label>
      <label>
        密码
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button
        type="submit"
        className="btn-primary"
        style={{ width: "100%", marginTop: 14 }}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <LoaderCircle size={18} className="animate-spin" aria-hidden />
        ) : (
          <LogIn size={18} aria-hidden />
        )}
        <span>登录</span>
      </button>
    </form>
  );
}
