"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleX } from "lucide-react";
import {
  clearStudyStorage,
  flushActivityNow,
} from "@/lib/study-events";

export default function ExitButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exit = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    flushActivityNow();
    try {
      const response = await fetch("/api/exit", { method: "POST" });
      if (!response.ok) {
        setError("退出请求未送达，请检查网络后重试。");
        return;
      }
      clearStudyStorage();
      router.push("/exited");
    } catch {
      setError("退出请求未送达，请检查网络后重试。");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn-ghost"
        onClick={exit}
        disabled={pending}
        aria-label="退出实验"
      >
        <CircleX size={17} aria-hidden />
        <span>退出实验</span>
      </button>
      {error ? <span className="sr-only">{error}</span> : null}
    </div>
  );
}
