import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Captions, MessageSquare, PlayCircle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Classroom() {
  const { classId } = useParams();
  const [data, setData] = useState(null);
  const [question, setQuestion] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => setData((await platformApi.classDetail(classId)).data);
  useEffect(() => { load(); }, [classId]);
  const join = async () => { await platformApi.joinClass(classId); setMessage("Attendance saved. You can leave and continue later from any device."); load(); };
  const ask = async () => { await platformApi.askClassQuestion(classId, { question, language: "en" }); setQuestion(""); load(); };
  const complete = async () => { await platformApi.completeClass(classId); setMessage("Class completed. A downloadable certificate has been added."); load(); };
  if (!data) return <PageShell title="Classroom"><div data-testid="classroom-loading-state">Opening classroom…</div></PageShell>;
  const item = data.class;
  return (
    <PageShell eyebrow={item.professor.name} title={item.title}>
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success" data-testid="classroom-message">{message}</div>}
      <div className="grid gap-6 lg:grid-cols-3" data-testid="classroom-grid">
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2" data-testid="live-classroom-card">
          <div className="aspect-video rounded-2xl bg-brand-dark p-6 text-white" data-testid="ai-video-class-stage"><Video className="mb-4" /><h2 className="font-heading text-3xl" data-testid="video-professor-name">{item.professor.avatar} {item.professor.name}</h2><p className="mt-3 text-white/80" data-testid="video-professor-style">{item.professor.teaching_style}</p><p className="mt-6 rounded-xl bg-white/10 p-4" data-testid="video-class-caption"><Captions className="mr-2 inline" /> Captions and transcript are available in all supported languages.</p></div>
          <div className="mt-5 flex flex-wrap gap-3"><Button onClick={join} data-testid="join-class-button" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Join / mark attendance</Button><Button onClick={complete} data-testid="complete-class-button" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Complete class</Button></div>
          <section className="mt-6 rounded-xl bg-brand-card p-5" data-testid="written-lesson-section"><h3 className="font-heading text-2xl text-brand-dark">Written lesson version</h3><p className="mt-2 text-brand-charcoal" data-testid="written-lesson-text">{item.text_lesson}</p></section>
          <section className="mt-6 rounded-xl bg-brand-card p-5" data-testid="replay-section"><h3 className="font-heading text-2xl text-brand-dark"><PlayCircle className="mr-2 inline text-brand-primary" /> Replay and transcript</h3><p className="mt-2 text-brand-charcoal" data-testid="class-transcript-text">{item.transcript}</p></section>
        </section>
        <aside className="rounded-2xl border border-brand-border bg-white p-6" data-testid="class-qa-panel">
          <h2 className="font-heading text-2xl text-brand-dark"><MessageSquare className="mr-2 inline text-brand-primary" /> Ask during class</h2>
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} data-testid="class-question-input" className="mt-4 rounded-xl border-brand-border" placeholder="Ask a personalized question…" />
          <Button onClick={ask} disabled={!question.trim()} data-testid="ask-class-question-button" className="mt-3 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Ask professor</Button>
          <div className="mt-5 space-y-3" data-testid="class-question-history">{data.questions.map((q) => <div key={q.id} className="rounded-xl bg-brand-card p-3" data-testid={`class-question-${q.id}`}><p className="text-sm font-medium text-brand-dark">{q.question}</p><p className="mt-2 text-sm text-brand-muted">{q.answer}</p></div>)}</div>
        </aside>
      </div>
    </PageShell>
  );
}