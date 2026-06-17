import { useEffect, useState } from 'react';
import { Map, Route } from 'lucide-react';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Roadmap() {
  const { currentUser } = useAuth();
  const [roadmap, setRoadmap] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('onboarding_data').select('roadmap').eq('user_id', currentUser.id).maybeSingle()
      .then(({ data, error }) => {
        if (error) setError('Roadmap could not load.');
        else setRoadmap(data?.roadmap || []);
      });
  }, [currentUser]);

  return (
    <PageShell eyebrow="Personalized roadmap" title="Your first four-week path">
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error">{error}</div>}
      <div className="relative space-y-5">
        {roadmap.map((week) => (
          <article key={week.week} className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary text-white font-heading font-semibold">
                {week.week}
              </span>
              <h2 className="font-heading text-2xl font-medium text-brand-dark">{week.title}</h2>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {week.actions?.map((action) => (
                <div key={action} className="rounded-xl bg-brand-card p-4 text-sm text-brand-charcoal">
                  <Route className="mb-2 text-brand-primary" size={17} />
                  {action}
                </div>
              ))}
            </div>
          </article>
        ))}
        {roadmap.length === 0 && (
          <div className="rounded-2xl border border-brand-border bg-white p-8 text-center">
            <Map className="mx-auto mb-3 text-brand-primary" size={40} />
            <p className="font-heading text-xl text-brand-dark">No roadmap yet</p>
            <p className="mt-2 text-brand-muted">Complete onboarding to generate your personalized roadmap.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
