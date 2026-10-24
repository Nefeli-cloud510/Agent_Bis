import type { ReactNode } from "react";
import { Bot, ShieldCheck } from "lucide-react";
import type { ActivityPage } from "@/lib/study-events";
import ActivityTracker from "./ActivityTracker";
import ExitButton from "./ExitButton";

export type StudyStepLabel = {
  id: string;
  label: string;
};

export default function StudyShell({
  steps,
  activeStep,
  activePage,
  children,
  showExit = true,
  narrow = false,
}: {
  steps: readonly StudyStepLabel[];
  activeStep: string;
  activePage: ActivityPage;
  children: ReactNode;
  showExit?: boolean;
  narrow?: boolean;
}) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStep)
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="study-header">
        <div className="flex min-w-0 items-center gap-2">
          <span className="brand-mark" aria-hidden>
            <Bot size={18} />
          </span>
          <a className="brand" href="/start">
            <span className="brand-caption">购物体验研究</span>
          </a>
          <span className="hidden text-xs text-[var(--ink-soft)] sm:inline-flex sm:items-center sm:gap-1">
            <ShieldCheck size={14} aria-hidden />
            智能体商品推荐体验
          </span>
        </div>
        {showExit ? <ExitButton /> : null}
      </header>

      <main className={`study-main ${narrow ? "narrow" : ""}`}>
        <nav className="progress" aria-label="实验进度">
          {steps.map((step, index) => {
            let state = "";
            if (index === activeIndex) state = "active";
            if (index < activeIndex) state = "done";
            return (
              <div
                key={step.id}
                className={`progress-step ${state}`}
                aria-current={index === activeIndex ? "step" : undefined}
              >
                <span className="dot" aria-hidden />
                <span>{step.label}</span>
              </div>
            );
          })}
        </nav>
        {children}
      </main>

      <footer className="study-footer">购物体验研究</footer>
      <ActivityTracker page={activePage} />
    </div>
  );
}
