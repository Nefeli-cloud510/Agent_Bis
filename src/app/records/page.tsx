import { HISTORY_CONTENT } from "@/config/content";
import AdvanceButton from "@/components/AdvanceButton";
import StudyShell from "@/components/StudyShell";
import {
  requireParticipantSession,
  requireStep,
  stepsForSession,
} from "@/lib/study-guard";

export const instant = false;

export default async function RecordsPage() {
  const session = await requireParticipantSession();
  requireStep(session, "history");

  return (
    <StudyShell
      steps={stepsForSession(session.remind)}
      activeStep="history"
      activePage="history"
    >
      <section className="agent-panel">
        <h1 className="agent-title">{HISTORY_CONTENT.title}</h1>
        {HISTORY_CONTENT.sections.map((section) => (
          <div key={section.heading}>
            <h2 className="agent-subtitle">{section.heading}</h2>
            {section.messages.map((message) => (
              <p key={message} className="message-bubble">
                {message}
              </p>
            ))}
          </div>
        ))}
        <p className="history-note">{HISTORY_CONTENT.note}</p>
        <div className="consent-actions">
          <AdvanceButton
            api="/api/advance"
            label={HISTORY_CONTENT.button}
            fromStep="history"
          />
        </div>
      </section>
    </StudyShell>
  );
}
