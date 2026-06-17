import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, MessageSquare, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { PROFESSORS } from '@/data/platform';

export default function ProfessorDirectory() {
  const primaryFaculty = PROFESSORS.filter((p) => ['hope', 'insight', 'compass'].includes(p.id));

  return (
    <PageShell eyebrow="AI Professor faculty" title="Meet your professors">
      <p className="mb-8 max-w-3xl text-lg text-brand-charcoal">
        Each professor is a specialized AI mentor who remembers your journey, adapts to your needs, and guides you with evidence-based compassion.
      </p>

      <section className="mb-10">
        <h2 className="mb-5 font-heading text-2xl font-medium text-brand-dark">Featured faculty</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {primaryFaculty.map((professor) => (
            <Link
              key={professor.id}
              to={`/professors/${professor.id}`}
              className="group rounded-2xl border border-brand-border bg-white p-6 transition-all hover:border-brand-primary hover:shadow-md"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-card text-3xl">
                {professor.avatar}
              </div>
              <h3 className="font-heading text-xl font-medium text-brand-dark group-hover:text-brand-primary transition-colors">
                {professor.name}
              </h3>
              <p className="mt-1 text-sm text-brand-primary font-medium">{professor.focus}</p>
              <p className="mt-2 text-sm text-brand-charcoal line-clamp-3">{professor.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {professor.specialties.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-full bg-brand-card px-2.5 py-1 text-xs text-brand-charcoal">{s}</span>
                ))}
              </div>
              {professor.video_url && (
                <div className="mt-4 flex items-center gap-1.5 text-sm text-brand-primary">
                  <PlayCircle size={15} /> Video introduction available
                </div>
              )}
              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-primary opacity-0 transition-opacity group-hover:opacity-100">
                View profile <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-5 font-heading text-2xl font-medium text-brand-dark">Full faculty</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROFESSORS.map((professor) => (
            <Link
              key={professor.id}
              to={`/professors/${professor.id}`}
              className="group flex items-start gap-4 rounded-2xl border border-brand-border bg-white p-5 transition-all hover:border-brand-primary hover:shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-card text-2xl">
                {professor.avatar}
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-medium text-brand-dark group-hover:text-brand-primary transition-colors">{professor.name}</h3>
                <p className="text-sm text-brand-primary">{professor.focus}</p>
                <p className="mt-1 text-xs text-brand-muted">{professor.school}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-brand-border bg-white p-8 text-center">
        <GraduationCap className="mx-auto mb-4 text-brand-primary" size={36} />
        <h2 className="font-heading text-2xl text-brand-dark">Talk to any professor now</h2>
        <p className="mt-2 text-brand-charcoal">
          Every professor remembers your goals, progress, and previous conversations. Start a session whenever you need guidance.
        </p>
        <Button asChild className="mt-5 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
          <Link to="/ai-professors"><MessageSquare size={16} /> Start a conversation</Link>
        </Button>
      </section>
    </PageShell>
  );
}
