import { PERMISSION_CONTENT } from "@/config/content";
import AdvanceButton from "@/components/AdvanceButton";
import StudyShell from "@/components/StudyShell";
import {
  redirectToCurrentStep,
  requireParticipantSession,
  stepsForSession,
} from "@/lib/study-guard";

export const instant = false;

export default async function PermissionPage() {
  const session = await requireParticipantSession();
  if (session.remind !== 1 || session.current_step !== "permission") {
    redirectToCurrentStep(session);
  }
  const content = PERMISSION_CONTENT[session.scope as 1 | 2];

  return (
    <StudyShell
      steps={stepsForSession(session.remind)}
      activeStep="permission"
      activePage="permission"
    >
      <section className="agent-panel permission-panel">
        <h1 className="agent-title">{content.title}</h1>
        <p className="agent-text">{content.text}</p>
        <div className="consent-actions">
          <AdvanceButton
            api="/api/advance"
            label={content.button}
            fromStep="permission"
          />
        </div>
      </section>
    </StudyShell>
  );
}
