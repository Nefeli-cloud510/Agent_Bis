"use client";

import { useSyncExternalStore, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import {
  ALL_QUESTION_IDS,
  QUESTIONNAIRE_CONTENT,
} from "@/config/content";
import {
  buildStudyPayload,
  clearStudyStorage,
  flushActivityNow,
  readAnswers,
  saveAnswers,
} from "@/lib/study-events";

const EMPTY_ANSWERS: Readonly<Record<string, string>> = Object.freeze({});
const EMPTY_RECORD: Readonly<Record<string, string>> = EMPTY_ANSWERS;
const answerListeners = new Set<() => void>();
let cachedAnswers: Record<string, string> | null = null;

function getAnswersSnapshot(): Readonly<Record<string, string>> {
  if (typeof window === "undefined") return EMPTY_ANSWERS;
  if (!cachedAnswers) cachedAnswers = readAnswers();
  return cachedAnswers;
}

function getServerAnswersSnapshot(): Readonly<Record<string, string>> {
  return EMPTY_RECORD;
}

function subscribeAnswers(listener: () => void): () => void {
  answerListeners.add(listener);
  return () => {
    answerListeners.delete(listener);
  };
}

function commitAnswers(next: Record<string, string>): void {
  cachedAnswers = next;
  saveAnswers(next);
  for (const listener of answerListeners) listener();
}

export default function QuestionnaireForm() {
  const answers = useSyncExternalStore(
    subscribeAnswers,
    getAnswersSnapshot,
    getServerAnswersSnapshot
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (questionId: string, value: string) => {
    commitAnswers({ ...answers, [questionId]: value });
  };

  const submit = async () => {
    if (pending) return;
    const missing = ALL_QUESTION_IDS.find((questionId) => !answers[questionId]);
    if (missing) {
      const questionNumber = Number(missing.replace("q", ""));
      setError(`请完成第 ${questionNumber} 题后再提交。`);
      const target = document.querySelector<HTMLElement>(
        `[data-question="${missing}"]`
      );
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
      target?.focus();
      return;
    }

    setPending(true);
    setError(null);
    flushActivityNow();
    const payload = buildStudyPayload();
    const numericAnswers = Object.fromEntries(
      ALL_QUESTION_IDS.map((questionId) => [
        questionId,
        Number(answers[questionId]),
      ])
    );

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: numericAnswers,
          timings: payload.timings,
          pageVisits: payload.pageVisits,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        nextUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "提交没有成功，请重试。");
        return;
      }
      clearStudyStorage();
      window.location.assign(data.nextUrl ?? "/done");
    } catch {
      setError("提交未成功，请检查网络后重试；当前答案仍然保留。");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <p className="agent-text" style={{ marginBottom: 18 }}>
        {QUESTIONNAIRE_CONTENT.instruction}
      </p>
      {QUESTIONNAIRE_CONTENT.sections.map((section) => (
        <section key={section.heading ?? "main"}>
          {section.heading ? (
            <h2 className="agent-subtitle">{section.heading}</h2>
          ) : null}
          {section.questions.map((question) => {
            const questionNumber = Number(question.id.replace("q", ""));
            return (
              <fieldset
                key={question.id}
                className="question-fieldset"
                data-question={question.id}
                tabIndex={-1}
              >
                <legend className="question-legend">{question.text}</legend>
                <div className="scale-row" role="radiogroup">
                  {QUESTIONNAIRE_CONTENT.scaleLabels.map((option) => (
                    <label
                      key={option.value}
                      className="scale-option"
                      htmlFor={`${question.id}-${option.value}`}
                    >
                      <input
                        id={`${question.id}-${option.value}`}
                        type="radio"
                        name={question.id}
                        value={option.value}
                        checked={answers[question.id] === String(option.value)}
                        onChange={() =>
                          handleChange(question.id, String(option.value))
                        }
                      />
                      <span>{option.value}</span>
                      <small>{option.label}</small>
                    </label>
                  ))}
                </div>
                <span className="sr-only">
                  第{questionNumber}题
                </span>
              </fieldset>
            );
          })}
        </section>
      ))}

      {error ? <p className="form-error">{error}</p> : null}
      <div
        style={{
          marginTop: 22,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          type="button"
          className="btn-primary"
          onClick={submit}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <LoaderCircle size={18} className="animate-spin" aria-hidden />
          ) : (
            <Check size={18} aria-hidden />
          )}
          <span>{QUESTIONNAIRE_CONTENT.submitButton}</span>
        </button>
      </div>
    </div>
  );
}
