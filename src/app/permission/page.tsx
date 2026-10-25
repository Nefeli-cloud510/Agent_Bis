import { PERMISSION_CONTENT } from "@/config/content";
import AdvanceButton from "@/components/AdvanceButton";
import StudyShell from "@/components/StudyShell";
import {
  requireParticipantSession,
  requireStep,
  stepsForSession,
} from "@/lib/study-guard";

export const instant = false;

export default async function PermissionPage() {
  const session = await requireParticipantSession();
  requireStep(session, "permission");
  const content = PERMISSION_CONTENT[session.scope as 1 | 2];

  return (
    <StudyShell
      steps={stepsForSession()}
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
