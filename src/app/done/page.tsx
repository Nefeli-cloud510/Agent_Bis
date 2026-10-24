import { CheckCircle2 } from "lucide-react";
import { END_CONTENT } from "@/config/content";
import StudyShell from "@/components/StudyShell";
import {
  redirectToCurrentStep,
  requireParticipantSession,
  stepsForSession,
} from "@/lib/study-guard";

export const instant = false;

export default async function DonePage() {
  const session = await requireParticipantSession();
  if (session.current_step !== "done" && !session.submitted_at) {
    redirectToCurrentStep(session);
  }

  return (
    <StudyShell
      steps={stepsForSession(session.remind)}
      activeStep="questionnaire"
      activePage="done"
      showExit={false}
      narrow
    >
      <section className="agent-panel done-panel">
        <CheckCircle2 size={44} className="done-icon" aria-hidden />
        <h1 className="agent-title">{END_CONTENT.title}</h1>
        <p className="agent-text">{END_CONTENT.text}</p>
      </section>
    </StudyShell>
  );
}
