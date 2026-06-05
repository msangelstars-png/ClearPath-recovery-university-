import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Programs() {
  const [programs, setPrograms] = useState([]);
  useEffect(() => { platformApi.programs().then(({ data }) => setPrograms(data.programs)); }, []);
  return (
    <PageShell eyebrow="Semester programs" title="Complete university curriculum by school">
      <div className="grid gap-6" data-testid="programs-list">
        {programs.map((program) => <article key={program.id} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`program-card-${program.id}`}><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><GraduationCap className="mb-3 text-brand-primary" /><h2 className="font-heading text-3xl text-brand-dark" data-testid={`program-title-${program.id}`}>{program.school_name}</h2><p className="mt-2 text-brand-muted" data-testid={`program-description-${program.id}`}>{program.description}</p><p className="mt-3 text-sm font-medium text-brand-charcoal" data-testid={`program-professor-${program.id}`}>{program.professor}</p></div><Button asChild data-testid={`open-program-button-${program.id}`} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><Link to={`/programs/${program.id}`}>Open program</Link></Button></div><div className="mt-6 grid gap-4 md:grid-cols-4">{program.tracks.map((track) => <div key={track.id} className="rounded-xl bg-brand-card p-4" data-testid={`program-track-${track.id}`}><div className="flex items-center gap-2"><Layers3 className="text-brand-primary" size={17} /><p className="font-medium text-brand-dark">{track.name}</p></div><Progress value={track.progress?.progress_percentage || 0} className="mt-3 bg-white" data-testid={`program-track-progress-${track.id}`} /><p className="mt-2 text-xs text-brand-muted">{track.progress?.progress_percentage || 0}% complete</p></div>)}</div></article>)}
      </div>
    </PageShell>
  );
}