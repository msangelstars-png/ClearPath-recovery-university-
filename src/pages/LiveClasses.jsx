import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Captions, MessageSquare, PlayCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { LIVE_CLASSES } from '@/data/platform';

export default function LiveClasses() {
  const icon = (type) =>
    type === 'live_video' ? <Video size={18} /> : type === 'live_text' ? <MessageSquare size={18} /> : <PlayCircle size={18} />;

  return (
    <PageShell eyebrow="Live learning ecosystem" title="Live AI classes, replays, and written lessons">
      <div className="grid gap-5 md:grid-cols-2">
        {LIVE_CLASSES.map((item) => (
          <article key={item.id} className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="flex items-center gap-2 text-brand-primary">
              {icon(item.type)} {item.type.replaceAll('_', ' ')}
            </div>
            <h2 className="mt-4 font-heading text-2xl text-brand-dark">{item.title}</h2>
            <p className="mt-2 text-sm text-brand-muted">{item.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-brand-charcoal">
              <span className="rounded-full bg-brand-card px-3 py-1">{item.recurring}</span>
              <span className="rounded-full bg-brand-card px-3 py-1">{item.level}</span>
              <span className="rounded-full bg-brand-card px-3 py-1"><Captions className="mr-1 inline" size={13} /> Captions</span>
              <span className="rounded-full bg-brand-card px-3 py-1">Replay</span>
            </div>
            <Button asChild className="mt-5 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
              <Link to={`/classes/${item.id}`}>Enter classroom</Link>
            </Button>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
