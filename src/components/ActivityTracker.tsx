"use client";

import { useEffect, useRef } from "react";
import {
  FLUSH_EVENT,
  saveActivity,
  saveVisits,
  readActivity,
  readVisits,
  type ActivityPage,
  type PageVisit,
} from "@/lib/study-events";

export default function ActivityTracker({ page }: { page: ActivityPage }) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const activity = readActivity();
    const visits = readVisits();
    const existing = activity[page];
    activity[page] = {
      activeMs: existing?.activeMs ?? 0,
      enteredAt: existing?.enteredAt ?? new Date().toISOString(),
    };
    const visitEntry: PageVisit = {
      page,
      enteredAt: new Date().toISOString(),
      activeMs: 0,
    };
    visits.push(visitEntry);
    saveActivity(activity);
    saveVisits(visits);

    const localActivity = activity;
    const localVisits = visits;
    const currentEntry = localVisits[localVisits.length - 1];
    let lastTick = performance.now();
    let active =
      document.visibilityState === "visible" && document.hasFocus();

    const isActive = () =>
      document.visibilityState === "visible" && document.hasFocus();

    const flush = () => {
      const now = performance.now();
      if (active) {
        const added = Math.round(Math.max(0, now - lastTick));
        localActivity[page] = {
          activeMs: Math.round((localActivity[page]?.activeMs ?? 0) + added),
          enteredAt: localActivity[page]?.enteredAt,
        };
        currentEntry.activeMs = Math.round(
          (currentEntry.activeMs ?? 0) + added
        );
      }
      lastTick = now;
      currentEntry.leftAt = new Date().toISOString();
      saveActivity(localActivity);
      saveVisits(localVisits);
    };

    const updateActivity = () => {
      const wasActive = active;
      active = isActive();
      if (active && !wasActive) lastTick = performance.now();
      if (!active || wasActive) flush();
    };

    const flushHandler = () => flush();
    window.addEventListener(FLUSH_EVENT, flushHandler);
    document.addEventListener("visibilitychange", updateActivity);
    window.addEventListener("blur", updateActivity);
    window.addEventListener("focus", updateActivity);
    window.addEventListener("pagehide", flushHandler);

    timerRef.current = setInterval(() => {
      const nowActive = isActive();
      if (nowActive !== active) {
        active = nowActive;
        if (active) lastTick = performance.now();
      }
      flush();
    }, 1000);

    return () => {
      window.removeEventListener(FLUSH_EVENT, flushHandler);
      document.removeEventListener("visibilitychange", updateActivity);
      window.removeEventListener("blur", updateActivity);
      window.removeEventListener("focus", updateActivity);
      window.removeEventListener("pagehide", flushHandler);
      if (timerRef.current) clearInterval(timerRef.current);
      flush();
    };
  }, [page]);

  return null;
}
