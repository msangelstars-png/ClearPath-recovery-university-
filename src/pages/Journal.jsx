import { useEffect, useState } from 'react';
import { PenLine, SmilePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Journal() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [mood, setMood] = useState(7);
  const [reflection, setReflection] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [j, c] = await Promise.all([
      supabase.from('journal_entries').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('checkins').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(14),
    ]);
    setEntries(j.data || []);
    setCheckins(c.data || []);
  };

  useEffect(() => { load(); }, [currentUser]);

  const saveJournal = async () => {
    if (!content.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('journal_entries').insert({
      content,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      sentiment: 'neutral',
    });
    if (error) { setError('Journal entry could not be saved.'); } else { setContent(''); setTags(''); load(); }
    setSaving(false);
  };

  const saveCheckin = async () => {
    if (!reflection.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('checkins').insert({
      mood_score: Number(mood),
      reflection_notes: reflection,
    });
    if (error) { setError('Daily check-in could not be saved.'); } else { setReflection(''); load(); }
    setSaving(false);
  };

  return (
    <PageShell eyebrow="Daily check-ins and journaling" title="Track mood, reflection, and growth">
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-brand-border bg-white p-6">
          <SmilePlus className="mb-3 text-brand-primary" />
          <h2 className="font-heading text-2xl font-medium text-brand-dark">Daily check-in</h2>
          <label htmlFor="mood" className="mt-5 block text-sm font-medium text-brand-charcoal">
            Mood score: <span className="text-brand-primary font-semibold">{mood}</span>
          </label>
          <input
            id="mood"
            type="range"
            min="1"
            max="10"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="mt-3 w-full accent-brand-primary"
          />
          <div className="mt-1 flex justify-between text-xs text-brand-muted">
            <span>1 — Struggling</span>
            <span>10 — Thriving</span>
          </div>
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="What do you notice today?"
            className="mt-5 rounded-xl border-brand-border bg-white"
          />
          <Button
            onClick={saveCheckin}
            disabled={!reflection.trim() || saving}
            className="mt-4 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"
          >
            Save check-in
          </Button>
        </section>

        <section className="rounded-2xl border border-brand-border bg-white p-6">
          <PenLine className="mb-3 text-brand-primary" />
          <h2 className="font-heading text-2xl font-medium text-brand-dark">Private journal</h2>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely…"
            className="mt-5 min-h-[150px] rounded-xl border-brand-border bg-white"
          />
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags, separated by commas"
            className="mt-3 rounded-xl border-brand-border bg-white"
          />
          <Button
            onClick={saveJournal}
            disabled={!content.trim() || saving}
            className="mt-4 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"
          >
            Save journal
          </Button>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-brand-border bg-white p-6">
          <h2 className="font-heading text-2xl font-medium text-brand-dark">Recent check-ins</h2>
          <div className="mt-4 space-y-3">
            {checkins.length === 0 && <p className="text-sm text-brand-muted">No check-ins yet. Start your first one above.</p>}
            {checkins.map((item) => (
              <div key={item.id} className="rounded-xl bg-brand-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-brand-dark">Mood {item.mood_score}/10</p>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`h-2 w-2 rounded-full ${i < item.mood_score ? 'bg-brand-primary' : 'bg-brand-border'}`} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 text-sm text-brand-muted">{item.reflection_notes}</p>
                <p className="mt-1 text-xs text-brand-muted">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-brand-border bg-white p-6">
          <h2 className="font-heading text-2xl font-medium text-brand-dark">Journal history</h2>
          <div className="mt-4 space-y-3">
            {entries.length === 0 && <p className="text-sm text-brand-muted">No journal entries yet. Write your first one above.</p>}
            {entries.map((item) => (
              <div key={item.id} className="rounded-xl bg-brand-card p-4">
                <p className="text-brand-charcoal">{item.content}</p>
                {item.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white px-2 py-0.5 text-xs text-brand-muted">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-xs text-brand-muted">{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
