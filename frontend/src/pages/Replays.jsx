import { useEffect, useState } from "react";
import { Captions, PlayCircle } from "lucide-react";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Replays() {
  const [replays, setReplays] = useState([]);
  useEffect(() => { platformApi.replays().then(({ data }) => setReplays(data.replays)); }, []);
  return (
    <PageShell eyebrow="Replay library" title="Recorded classes, transcripts, and written reviews">
      <div className="grid gap-5 md:grid-cols-2" data-testid="replay-grid">
        {replays.map((replay) => <article key={`${replay.type}-${replay.id}`} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`replay-card-${replay.id}`}><PlayCircle className="mb-3 text-brand-primary" /><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid={`replay-type-${replay.id}`}>{replay.type}</p><h2 className="mt-2 font-heading text-2xl text-brand-dark" data-testid={`replay-title-${replay.id}`}>{replay.title}</h2><p className="mt-3 text-sm text-brand-muted" data-testid={`replay-transcript-${replay.id}`}>{replay.transcript}</p><p className="mt-4 text-sm text-brand-charcoal" data-testid={`replay-languages-${replay.id}`}><Captions className="mr-1 inline" size={15} /> {replay.languages.join(", ")}</p></article>)}
      </div>
    </PageShell>
  );
}