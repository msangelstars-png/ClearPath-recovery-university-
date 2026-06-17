import { Captions, PlayCircle } from 'lucide-react';
import { PageShell } from '@/components/Layout';
import { REPLAYS } from '@/data/platform';

export default function Replays() {
  return (
    <PageShell eyebrow="Replay library" title="Recorded classes, transcripts, and written reviews">
      <div className="grid gap-5 md:grid-cols-2">
        {REPLAYS.map((replay) => (
          <article key={replay.id} className="rounded-2xl border border-brand-border bg-white p-6">
            <PlayCircle className="mb-3 text-brand-primary" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{replay.type}</p>
            <h2 className="mt-2 font-heading text-2xl text-brand-dark">{replay.title}</h2>
            <p className="mt-3 text-sm text-brand-muted">{replay.transcript}</p>
            <p className="mt-4 text-sm text-brand-charcoal">
              <Captions className="mr-1 inline" size={15} /> {replay.languages.join(', ')}
            </p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
