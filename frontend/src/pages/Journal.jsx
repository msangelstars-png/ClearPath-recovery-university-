import { useEffect, useState } from "react";
import { PenLine, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [mood, setMood] = useState(7);
  const [reflection, setReflection] = useState("");
  const [error, setError] = useState("");
  const load = async () => { try { const [j, c] = await Promise.all([platformApi.journal(), platformApi.checkins()]); setEntries(j.data.entries); setCheckins(c.data.checkins); setError(""); } catch { setError("Journal and check-in history could not load."); } };
  useEffect(() => { load(); }, []);
  const saveJournal = async () => { try { await platformApi.createJournal({ content, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }); setContent(""); setTags(""); load(); } catch { setError("Journal entry could not be saved."); } };
  const saveCheckin = async () => { try { await platformApi.createCheckin({ mood_score: Number(mood), reflection_notes: reflection }); setReflection(""); load(); } catch { setError("Daily check-in could not be saved."); } };
  return (
    <PageShell eyebrow="Daily check-ins and journaling" title="Track mood, reflection, and growth">
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error" data-testid="journal-error-message">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-2" data-testid="journal-grid">
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="daily-checkin-card">
          <SmilePlus className="mb-3 text-brand-primary" /><h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="daily-checkin-title">Daily check-in</h2>
          <label htmlFor="mood" className="mt-5 block text-sm font-medium text-brand-charcoal">Mood score: <span data-testid="mood-score-value">{mood}</span></label>
          <input id="mood" type="range" min="1" max="10" value={mood} onChange={(e) => setMood(e.target.value)} data-testid="mood-score-slider" className="mt-3 w-full accent-brand-primary" />
          <Textarea value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder="What do you notice today?" data-testid="checkin-reflection-input" className="mt-5 rounded-xl border-brand-border bg-white" />
          <Button onClick={saveCheckin} disabled={!reflection.trim()} data-testid="save-checkin-button" className="mt-4 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Save check-in</Button>
        </section>
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="journal-entry-card">
          <PenLine className="mb-3 text-brand-primary" /><h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="journal-entry-title">Private journal</h2>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write freely…" data-testid="journal-content-input" className="mt-5 min-h-[150px] rounded-xl border-brand-border bg-white" />
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags, separated by commas" data-testid="journal-tags-input" className="mt-3 rounded-xl border-brand-border bg-white" />
          <Button onClick={saveJournal} disabled={!content.trim()} data-testid="save-journal-button" className="mt-4 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Save journal</Button>
        </section>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2" data-testid="history-grid">
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="recent-checkins-card"><h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="recent-checkins-title">Recent check-ins</h2><div className="mt-4 space-y-3">{checkins.map((item) => <div key={item.id} className="rounded-xl bg-brand-card p-4" data-testid={`checkin-history-${item.id}`}><p className="font-medium text-brand-dark" data-testid={`checkin-mood-${item.id}`}>Mood {item.mood_score}/10</p><p className="text-sm text-brand-muted" data-testid={`checkin-notes-${item.id}`}>{item.reflection_notes}</p></div>)}</div></section>
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="journal-history-card"><h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="journal-history-title">Journal history</h2><div className="mt-4 space-y-3">{entries.map((item) => <div key={item.id} className="rounded-xl bg-brand-card p-4" data-testid={`journal-history-${item.id}`}><p className="text-brand-charcoal" data-testid={`journal-content-${item.id}`}>{item.content}</p><p className="mt-2 text-xs uppercase tracking-[0.2em] text-brand-primary" data-testid={`journal-sentiment-${item.id}`}>{item.sentiment}</p></div>)}</div></section>
      </div>
    </PageShell>
  );
}