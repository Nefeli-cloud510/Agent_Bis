"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, CornerDownLeft, Send } from "lucide-react";
import AdvanceButton from "@/components/AdvanceButton";
import { RECOMMENDATION_CONTENT } from "@/config/content";
import {
  clearRecommendationLogs,
  readRecommendationLogs,
  readRecommendationState,
  saveRecommendationLogs,
  saveRecommendationState,
} from "@/lib/study-events";

type Props = {
  goods: 1 | 2;
  remind: 0 | 1;
};

type DialogueState = {
  sent: boolean;
  replyShown: boolean;
};

const REPLY_DELAY_MS = 900;

export default function RecommendationChat({ goods, remind }: Props) {
  const [state, setState] = useState<DialogueState>(() => {
    const persisted = readRecommendationState();
    return {
      sent: Boolean(persisted.taskSentAt),
      replyShown: Boolean(persisted.replyShownAt),
    };
  });
  const [typing, setTyping] = useState(() => {
    const persisted = readRecommendationState();
    return Boolean(persisted.taskSentAt && !persisted.replyShownAt);
  });
  const sendingRef = useRef(false);
  const replyRef = useRef<HTMLDivElement | null>(null);

  const content = RECOMMENDATION_CONTENT;
  const taskMessage = content.userMessage[goods];
  const assistantOpening = content.assistantOpening[goods];
  const remindText = content.remindText[remind];
  const items = useMemo(() => content.goods[goods].items, [content, goods]);

  const appendReplyIfNeeded = () => {
    const entries = readRecommendationLogs();
    if (!entries.some((entry) => entry.event === "assistant_reply_shown")) {
      saveRecommendationLogs([
        ...entries,
        {
          event: "assistant_reply_shown",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  useEffect(() => {
    if (state.sent && !state.replyShown) {
      const timer = window.setTimeout(() => {
        appendReplyIfNeeded();
        const persisted = readRecommendationState();
        const next = {
          taskSentAt: persisted.taskSentAt,
          replyShownAt: new Date().toISOString(),
        };
        saveRecommendationState(next);
        setTyping(false);
        setState({ sent: true, replyShown: true });
        window.setTimeout(() => {
          replyRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 80);
      }, REPLY_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [state.replyShown, state.sent]);

  const sendTask = () => {
    if (sendingRef.current || state.sent || typing) return;
    sendingRef.current = true;
    clearRecommendationLogs();
    const sentTimestamp = new Date().toISOString();
    saveRecommendationLogs([{ event: "task_sent", timestamp: sentTimestamp }]);
    saveRecommendationState({
      taskSentAt: sentTimestamp,
      replyShownAt: undefined,
    });
    setTyping(true);
    setState({ sent: true, replyShown: false });
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      sendTask();
    }
  };

  const logQuestionnaireStart = () => {
    const entries = readRecommendationLogs();
    if (!entries.some((entry) => entry.event === "questionnaire_started")) {
      saveRecommendationLogs([
        ...entries,
        {
          event: "questionnaire_started",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <section className="chat-panel" aria-label="购物助手对话">
      <div className="chat-head">
        <span className="chat-avatar" aria-hidden>
          <Bot size={18} />
        </span>
        <div>
          <strong>购物助手</strong>
          <span>商品推荐对话</span>
        </div>
      </div>

      <div className="chat-messages">
        {state.sent ? (
          <div className="chat-row chat-row-user">
            <div className="chat-bubble chat-bubble-user">{taskMessage}</div>
          </div>
        ) : null}

        {state.replyShown ? (
          <div className="chat-row chat-row-assistant" ref={replyRef}>
            <div className="chat-bubble chat-bubble-assistant">
              <p>{assistantOpening}</p>
              <p className="chat-remind">{remindText}</p>
              <div className="chat-product-grid">
                {items.map((item) => (
                  <article
                    key={item.name}
                    className="product-card chat-product-card"
                  >
                    <h2 className="product-name">{item.name}</h2>
                    <p className="product-desc">{item.description}</p>
                  </article>
                ))}
              </div>
              <div className="chat-actions">
                <AdvanceButton
                  api="/api/advance"
                  label={content.button}
                  fromStep="recommendation"
                  onBeforeAdvance={logQuestionnaireStart}
                />
              </div>
            </div>
          </div>
        ) : typing ? (
          <div className="chat-row chat-row-assistant">
            <div className="chat-bubble chat-bubble-assistant chat-typing">
              <span className="typing-dots" aria-hidden>
                <i />
                <i />
                <i />
              </span>
              {content.typing}
            </div>
          </div>
        ) : null}
      </div>

      {!state.sent ? (
        <div className="chat-composer">
          <div className="chat-input-wrap">
            <label className="sr-only" htmlFor="task-message">
              本次购物需求
            </label>
            <input
              id="task-message"
              className="chat-input"
              type="text"
              value={taskMessage}
              readOnly
              onKeyDown={handleKeyDown}
            />
            <button
              type="button"
              className="chat-send"
              onClick={sendTask}
              aria-label={content.sendButton}
            >
              <Send size={17} aria-hidden />
              {content.sendButton}
            </button>
          </div>
          <p className="chat-hint">
            <CornerDownLeft size={13} aria-hidden />
            按 Enter 发送
          </p>
        </div>
      ) : null}
    </section>
  );
}
