import { EXIT_CONTENT } from "@/config/content";

export default function ExitedPage() {
  return (
    <main className="study-main narrow">
      <section className="agent-panel">
        <h1 className="agent-title">{EXIT_CONTENT.title}</h1>
        <p className="agent-text">{EXIT_CONTENT.text}</p>
      </section>
    </main>
  );
}
