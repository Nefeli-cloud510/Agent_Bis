"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  flushActivityNow,
  getConsentKey,
  persistConsentKey,
} from "@/lib/study-events";

type Props = {
  api: "/api/consent" | "/api/advance";
  label: string;
  fullWidth?: boolean;
  fromStep?: string;
};

export default function AdvanceButton({
  api,
  label,
  fullWidth = true,
  fromStep,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advance = async () => {
    if (pending) return;
    setPending(true);
    setError(null);
    flushActivityNow();
    const body: { fromStep?: string; idempotencyKey?: string } = { fromStep };
    if (api === "/api/consent") {
      let consentKey = getConsentKey();
      if (!consentKey) {
        consentKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        persistConsentKey(consentKey);
      }
      body.idempotencyKey = consentKey;
    }
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        nextUrl?: string;
        error?: string;
        currentUrl?: string;
      };
      if (!response.ok || !data.ok) {
        if (data.currentUrl) {
          router.push(data.currentUrl);
          return;
        }
        setError(data.error ?? "请求未完成，请稍后重试。");
        return;
      }
      router.push(data.nextUrl ?? "/start");
    } catch {
      setError("请求未送达，请检查网络后重试。");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        className={`btn-primary ${fullWidth ? "w-full" : ""}`}
        onClick={advance}
        disabled={pending}
      >
        <span>{label}</span>
        <ArrowRight size={18} aria-hidden />
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
