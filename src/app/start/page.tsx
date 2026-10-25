import { CONSENT_CONTENT } from "@/config/content";
import AdvanceButton from "@/components/AdvanceButton";
import StudyShell from "@/components/StudyShell";
import {
  getParticipantSession,
  redirectToCurrentStep,
  stepsForSession,
} from "@/lib/study-guard";

export const instant = false;

export default async function StartPage() {
  const session = await getParticipantSession();
  if (session && session.current_step !== "consent") {
    redirectToCurrentStep(session);
  }
  const steps = stepsForSession();

  return (
    <StudyShell steps={steps} activeStep="consent" activePage="consent">
      <section className="agent-panel">
        <h1 className="agent-title">{CONSENT_CONTENT.title}</h1>
        {CONSENT_CONTENT.paragraphs.map((paragraph) => (
          <p key={paragraph} className="agent-text">
            {paragraph}
          </p>
        ))}
        <div className="consent-actions">
          <AdvanceButton
            api="/api/consent"
            label={CONSENT_CONTENT.button}
            fromStep="consent"
          />
        </div>
      </section>
    </StudyShell>
  );
}
