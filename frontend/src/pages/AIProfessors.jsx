import { useEffect, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/Layout";
import { professors } from "@/data/platform";
import { platformApi, streamProfessorChat } from "@/services/api";

export default function AIProfessors() {
  const [active, setActive] = useState(professors[0]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { platformApi.aiMessages(active.id).then(({ data }) => { setMessages(data.messages); setError(""); }).catch(() => setError("Professor history could not load. You can still try sending a new message.")); }, [active]);
  const send = async () => {
    if (!text.trim()) return;
    const prompt = text;
    setText("");
    setMessages((prev) => [...prev, { role: "user", content: prompt }, { role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      await streamProfessorChat({ professor_id: active.id, message: prompt }, (full) => setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: full }]));
      setError("");
    } catch {
      setError("The professor could not respond right now. Please try again shortly.");
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: "I’m having trouble connecting right now, but your next right step can still be small: breathe, write one need, and return when ready." }]);
    } finally {
      setStreaming(false);
    }
  };
  return (
    <PageShell eyebrow="AI Professor system" title="Ask a professor who remembers your path">
      <div className="grid gap-6 lg:grid-cols-4" data-testid="ai-professors-grid">
        <aside className="rounded-2xl border border-brand-border bg-white p-4" data-testid="professor-selector-panel">
          {professors.map((professor) => <button key={professor.id} onClick={() => setActive(professor)} data-testid={`professor-select-${professor.id}`} className={`mb-3 w-full rounded-xl border p-4 text-left transition-colors ${active.id === professor.id ? "border-brand-primary bg-brand-card" : "border-brand-border bg-white hover:bg-brand-card"}`}><p className="font-heading text-lg text-brand-dark" data-testid={`professor-name-${professor.id}`}>{professor.name}</p><p className="text-sm text-brand-muted" data-testid={`professor-focus-${professor.id}`}>{professor.focus}</p></button>)}
        </aside>
        <section className="rounded-2xl border border-brand-border bg-white p-5 lg:col-span-3" data-testid="professor-chat-panel">
          <div className="mb-5 rounded-xl bg-brand-card p-4" data-testid="active-professor-header"><Sparkles className="mb-2 text-brand-primary" /><h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="active-professor-name">{active.name}</h2><p className="text-sm text-brand-muted" data-testid="active-professor-tone">{active.tone}</p></div>
          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-brand-error" data-testid="ai-professor-error-message">{error}</p>}
          <div className="min-h-[360px] space-y-4 rounded-xl border border-brand-border bg-brand-base p-4" data-testid="ai-message-list">
            {messages.length === 0 && <p className="text-brand-muted" data-testid="empty-ai-message">Ask about your roadmap, a lesson, a difficult moment, or the next right step.</p>}
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed ${message.role === "user" ? "ml-auto bg-brand-primary text-white" : "bg-white text-brand-charcoal"}`} data-testid={`ai-message-${index}`}>{message.content || "Thinking with care…"}</div>)}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row" data-testid="ai-message-composer">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask for guidance…" data-testid="ai-message-input" className="min-h-[76px] rounded-xl border-brand-border bg-white" />
            <Button onClick={send} disabled={streaming} data-testid="send-ai-message-button" className="rounded-full bg-brand-primary px-6 text-white hover:bg-brand-primaryHover"><Send size={17} /> Send</Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}