"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, LoaderCircle } from "lucide-react";

export default function GroupPreviewForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group: Number(form.get("group")) }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        nextUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "预览会话创建失败。");
        return;
      }
      router.push(data.nextUrl ?? "/records");
    } catch {
      setError("预览请求未送达，请重试。");
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="admin-filter preview-form" onSubmit={preview}>
      <label>
        固定组预览（仅管理员/开发模式）
        <select name="group" defaultValue="1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((groupId) => (
            <option key={groupId} value={groupId}>
              组 {groupId}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="btn-ghost"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <LoaderCircle size={16} className="animate-spin" aria-hidden />
        ) : (
          <FlaskConical size={16} aria-hidden />
        )}
        <span>进入预览</span>
      </button>
      {error ? <p className="form-error preview-error">{error}</p> : null}
    </form>
  );
}
