import { useEffect, useState } from 'react';
import { Brain, Check, Languages, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PATHWAYS, languages } from '@/data/platform';

export default function Pathways() {
  const { currentUser } = useAuth();
  const [selected, setSelected] = useState([]);
  const [language, setLanguage] = useState('en');
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    supabase.from('learning_plans').select('*').eq('user_id', currentUser.id).maybeSingle().then(({ data }) => {
      if (data) {
        setPlan(data);
        setSelected(data.pathway_ids || []);
        setLanguage(data.preferred_language || 'en');
      }
    });
  }, [currentUser]);

  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((i) => i !== id) : [...selected, id]);

  const save = async () => {
    const weekly = selected.slice(0, 4).map((pid, i) => {
      const pathway = PATHWAYS.find((p) => p.id === pid);
      return {
        week: i + 1,
        pathway_id: pid,
        title: pathway?.title || pid,
        actions: [`Explore ${pathway?.title || pid} fundamentals`, 'Complete first lesson', 'Journal reflection', 'Check in with your professor'],
      };
    });

    const { data } = await supabase.from('learning_plans').upsert({
      user_id: currentUser.id,
      pathway_ids: selected,
      intensity: 'balanced',
      preferred_language: language,
      weekly_plan: weekly,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).select().maybeSingle();

    setPlan(data);
    setMessage('Your individualized learning plan has been updated and saved across logins.');
  };

  return (
    <PageShell eyebrow="Individualized learning plans" title="Choose pathways that match your story">
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success">{message}</div>}

      <section className="mb-6 rounded-2xl border border-brand-border bg-white p-6">
        <div className="flex items-center gap-3">
          <Languages className="text-brand-primary" />
          <h2 className="font-heading text-2xl text-brand-dark">Class and material language</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {languages.map((item) => (
            <button
              key={item.code}
              onClick={() => setLanguage(item.code)}
              className={`rounded-full border px-4 py-2 text-sm ${language === item.code ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-border bg-white text-brand-charcoal'}`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        {PATHWAYS.map((pathway) => (
          <article key={pathway.id} className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <Route className="text-brand-primary" />
              <button
                onClick={() => toggle(pathway.id)}
                className={`rounded-full border px-3 py-2 text-sm ${selected.includes(pathway.id) ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-border'}`}
              >
                {selected.includes(pathway.id) ? <Check size={15} /> : 'Add'}
              </button>
            </div>
            <h2 className="mt-4 font-heading text-2xl text-brand-dark">{pathway.title}</h2>
            <p className="mt-2 text-sm text-brand-muted">{pathway.description}</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-card px-3 py-1 text-sm text-brand-charcoal">
              <Brain size={15} /> {pathway.level}
            </p>
          </article>
        ))}
      </div>

      <Button
        onClick={save}
        disabled={selected.length === 0}
        className="mt-6 rounded-full bg-brand-primary px-6 py-6 text-white hover:bg-brand-primaryHover"
      >
        Save individualized learning plan
      </Button>

      {plan && (
        <section className="mt-8 rounded-2xl border border-brand-border bg-white p-6">
          <h2 className="font-heading text-2xl text-brand-dark">Current plan</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(plan.weekly_plan || []).map((week) => (
              <div key={`${week.week}-${week.pathway_id}`} className="rounded-xl bg-brand-card p-4">
                <p className="font-medium text-brand-dark">Week {week.week}: {week.title}</p>
                <p className="mt-2 text-sm text-brand-muted">{week.actions?.[0]}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
