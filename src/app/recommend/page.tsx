import { RECOMMENDATION_CONTENT } from "@/config/content";
import AdvanceButton from "@/components/AdvanceButton";
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
  const content = RECOMMENDATION_CONTENT;

  return (
    <StudyShell
      steps={stepsForSession(session.remind)}
      activeStep="recommendation"
      activePage="recommendation"
    >
      <section className="agent-panel">
        <p className="recommend-top">{content.remindText[remind]}</p>
        <h1 className="agent-title">{content.goods[goods].title}</h1>
        {content.goods[goods].items.map((item) => (
          <article key={item.name} className="product-card">
            <h2 className="product-name">{item.name}</h2>
            <p className="product-desc">{item.description}</p>
          </article>
        ))}
        <div className="consent-actions">
          <AdvanceButton
            api="/api/advance"
            label={content.button}
            fromStep="recommendation"
          />
        </div>
      </section>
    </StudyShell>
  );
}
