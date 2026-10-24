import QuestionnaireForm from "@/components/QuestionnaireForm";
import StudyShell from "@/components/StudyShell";
import {
  requireParticipantSession,
  requireStep,
  stepsForSession,
} from "@/lib/study-guard";

export const instant = false;

export default async function QuestionnairePage() {
  const session = await requireParticipantSession();
  requireStep(session, "questionnaire");

  return (
    <StudyShell
      steps={stepsForSession(session.remind)}
      activeStep="questionnaire"
      activePage="questionnaire"
      narrow
    >
      <section className="agent-panel">
        <QuestionnaireForm />
      </section>
    </StudyShell>
  );
}
