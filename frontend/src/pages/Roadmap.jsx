import { useEffect, useState } from "react";
import { Map, Route } from "lucide-react";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState([]);
  useEffect(() => { platformApi.dashboard().then(({ data }) => setRoadmap(data.profile?.roadmap || [])); }, []);
  return (
    <PageShell eyebrow="Personalized roadmap" title="Your first four-week path">
      <div className="relative space-y-5" data-testid="roadmap-list">
        {roadmap.map((week) => (
          <article key={week.week} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`roadmap-week-${week.week}`}>
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white" data-testid={`roadmap-week-number-${week.week}`}>{week.week}</span><h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid={`roadmap-week-title-${week.week}`}>{week.title}</h2></div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">{week.actions.map((action) => <div key={action} className="rounded-xl bg-brand-card p-4 text-sm text-brand-charcoal" data-testid={`roadmap-action-${action.toLowerCase().replaceAll(" ", "-")}`}><Route className="mb-2 text-brand-primary" size={17} />{action}</div>)}</div>
          </article>
        ))}
        {roadmap.length === 0 && <div className="rounded-2xl border border-brand-border bg-white p-8 text-center" data-testid="empty-roadmap-state"><Map className="mx-auto mb-3 text-brand-primary" />Complete onboarding to generate your roadmap.</div>}
      </div>
    </PageShell>
  );
}