import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { EVENTS } from '@/data/platform';

export default function Events() {
  const { currentUser } = useAuth();
  const [rsvps, setRsvps] = useState([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    const { data } = await supabase.from('event_rsvps').select('event_id,status,attended').eq('user_id', currentUser.id);
    setRsvps(data || []);
  };

  useEffect(() => { load(); }, [currentUser]);

  const rsvp = async (id) => {
    await supabase.from('event_rsvps').upsert({ user_id: currentUser.id, event_id: id, status: 'going' }, { onConflict: 'user_id,event_id' });
    setMessage('RSVP saved. This event is now tied to your student record.');
    load();
  };

  const attend = async (id) => {
    await supabase.from('event_rsvps').upsert({ user_id: currentUser.id, event_id: id, status: 'attended', attended: true }, { onConflict: 'user_id,event_id' });
    setMessage('Attendance recorded for your progress report.');
    load();
  };

  const getRsvp = (id) => rsvps.find((r) => r.event_id === id);

  return (
    <PageShell eyebrow="Events calendar" title="Office hours, workshops, and community events">
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success">{message}</div>}
      <div className="grid gap-5 md:grid-cols-2">
        {EVENTS.map((event) => {
          const myRsvp = getRsvp(event.id);
          return (
            <article key={event.id} className="rounded-2xl border border-brand-border bg-white p-6">
              <CalendarDays className="mb-3 text-brand-primary" />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{event.type.replaceAll('_', ' ')}</p>
              <h2 className="mt-2 font-heading text-2xl text-brand-dark">{event.title}</h2>
              <p className="mt-2 text-sm text-brand-muted">{event.description}</p>
              <p className="mt-3 text-sm font-medium text-brand-charcoal">{event.professor?.avatar} {event.professor?.name}</p>
              <p className="mt-1 text-xs text-brand-muted">{event.recurring}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {myRsvp && (
                  <span className="rounded-full bg-brand-card px-3 py-1 text-sm text-brand-success">
                    <CheckCircle2 className="mr-1 inline" size={14} /> {myRsvp.attended ? 'Attended' : 'RSVP saved'}
                  </span>
                )}
                {event.replay_available && (
                  <span className="rounded-full bg-brand-card px-3 py-1 text-sm text-brand-charcoal">
                    <PlayCircle className="mr-1 inline" size={14} /> Replay available
                  </span>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => rsvp(event.id)} disabled={myRsvp?.status === 'going' || myRsvp?.attended} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
                  RSVP
                </Button>
                <Button onClick={() => attend(event.id)} disabled={myRsvp?.attended} variant="outline" className="rounded-full border-brand-border bg-white">
                  Mark attended
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
