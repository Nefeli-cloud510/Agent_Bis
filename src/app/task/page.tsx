import { TASK_CONTENT } from "@/config/content";
import AdvanceButton from "@/components/AdvanceButton";
import StudyShell from "@/components/StudyShell";
import {
  requireParticipantSession,
  requireStep,
  stepsForSession,
} from "@/lib/study-guard";

export const instant = false;

export default async function TaskPage() {
  const session = await requireParticipantSession();
  requireStep(session, "task");
  const content = TASK_CONTENT[session.goods as 1 | 2];

  return (
    <StudyShell
      steps={stepsForSession(session.remind)}
      activeStep="task"
      activePage="task"
    >
      <section className="agent-panel">
        <h1 className="agent-title">{content.title}</h1>
        <p className="agent-text">{content.text}</p>
        <div className="consent-actions">
          <AdvanceButton
            api="/api/advance"
            label={content.button}
            fromStep="task"
          />
        </div>
      </section>
    </StudyShell>
  );
}
