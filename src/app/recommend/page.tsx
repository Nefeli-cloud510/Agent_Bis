import RecommendationChat from "@/components/RecommendationChat";
import StudyShell from "@/components/StudyShell";
import {
  requireParticipantSession,
  requireStep,
  stepsForSession,
} from "@/lib/study-guard";

export const instant = false;

export default async function RecommendPage() {
  const session = await requireParticipantSession();
  requireStep(session, "recommendation");
  const goods = session.goods as 1 | 2;
  const remind = session.remind as 0 | 1;

  return (
    <StudyShell
      steps={stepsForSession()}
      activeStep="recommendation"
      activePage="recommendation"
    >
      <RecommendationChat goods={goods} remind={remind} />
    </StudyShell>
  );
}
