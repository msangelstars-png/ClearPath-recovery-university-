import { Sparkles } from "lucide-react";
import { PageShell } from "@/components/Layout";
import { media, phasePreview } from "@/data/platform";

export default function Preview() {
  return (
    <PageShell eyebrow="Phase 2 and Phase 3 preview" title="ClearPath’s expansion roadmap">
      <div className="overflow-hidden rounded-2xl border border-brand-border bg-white" data-testid="preview-banner-card"><img src={media.campus} alt="Modern sunny campus building" className="aspect-[16/6] w-full object-cover" data-testid="preview-banner-image" /></div>
      <div className="mt-6 grid gap-6 md:grid-cols-2" data-testid="preview-phase-grid">
        {phasePreview.map((phase) => <article key={phase.phase} className="rounded-2xl border border-brand-border bg-white p-8" data-testid={`preview-phase-card-${phase.phase.toLowerCase().replaceAll(" ", "-")}`}><Sparkles className="mb-4 text-brand-primary" /><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid={`preview-phase-label-${phase.phase}`}>{phase.phase}</p><h2 className="mt-3 font-heading text-3xl font-medium text-brand-dark" data-testid={`preview-phase-title-${phase.phase}`}>{phase.title}</h2><div className="mt-6 flex flex-wrap gap-2">{phase.items.map((item) => <span key={item} className="rounded-full bg-brand-card px-3 py-2 text-sm text-brand-charcoal" data-testid={`preview-item-${item.toLowerCase().replaceAll(" ", "-")}`}>{item}</span>)}</div></article>)}
      </div>
    </PageShell>
  );
}