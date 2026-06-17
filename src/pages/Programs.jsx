import { Link } from 'react-router-dom';
import { GraduationCap, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageShell } from '@/components/Layout';
import { PROGRAMS } from '@/data/platform';
import { useAuth } from '@/context/AuthContext';

export default function Programs() {
  const { currentUser } = useAuth();
  return (
    <PageShell eyebrow="Semester programs" title="Complete university curriculum by school">
      <div className="grid gap-6">
        {PROGRAMS.map((program) => (
          <article key={program.id} className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <GraduationCap className="mb-3 text-brand-primary" />
                <h2 className="font-heading text-3xl text-brand-dark">{program.school_name}</h2>
                <p className="mt-2 text-brand-muted">{program.description}</p>
                <p className="mt-3 text-sm font-medium text-brand-charcoal">{program.professor}</p>
                <p className="mt-2 text-sm text-brand-muted">Graduation pathway: {(program.graduation_pathway || []).join(' → ')}</p>
              </div>
              <Button asChild className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
                <Link to={`/programs/${program.id}`}>{currentUser ? 'Open program' : 'Preview program'}</Link>
              </Button>
            </div>
            {currentUser && program.tracks?.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {program.tracks.map((track) => (
                  <div key={track.id} className="rounded-xl bg-brand-card p-4">
                    <div className="flex items-center gap-2">
                      <Layers3 className="text-brand-primary" size={17} />
                      <p className="font-medium text-brand-dark">{track.name}</p>
                    </div>
                    <Progress value={0} className="mt-3 bg-white" />
                    <p className="mt-2 text-xs text-brand-muted">0% complete</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </PageShell>
  );
}
