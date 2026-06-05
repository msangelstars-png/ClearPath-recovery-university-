import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const load = async () => setEvents((await platformApi.events()).data.events);
  useEffect(() => { load(); }, []);
  const rsvp = async (id) => { await platformApi.rsvpEvent(id, { status: "going", language: "en" }); setMessage("RSVP saved. This event is now tied to your student record."); load(); };
  const attend = async (id) => { await platformApi.attendEvent(id); setMessage("Attendance recorded for your progress report."); load(); };
  return (
    <PageShell eyebrow="Events calendar" title="Office hours, workshops, and community events">
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success" data-testid="event-message">{message}</div>}
      <div className="grid gap-5 md:grid-cols-2" data-testid="events-grid">
        {events.map((event) => <article key={event.id} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`event-card-${event.id}`}><CalendarDays className="mb-3 text-brand-primary" /><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid={`event-type-${event.id}`}>{event.type.replaceAll("_", " ")}</p><h2 className="mt-2 font-heading text-2xl text-brand-dark" data-testid={`event-title-${event.id}`}>{event.title}</h2><p className="mt-2 text-sm text-brand-muted" data-testid={`event-description-${event.id}`}>{event.description}</p><p className="mt-3 text-sm text-brand-charcoal" data-testid={`event-professor-${event.id}`}>{event.professor?.name}</p><div className="mt-4 flex flex-wrap gap-2">{event.rsvp && <span className="rounded-full bg-brand-card px-3 py-1 text-sm text-brand-success" data-testid={`event-rsvp-${event.id}`}><CheckCircle2 className="mr-1 inline" size={14} /> RSVP saved</span>}{event.replay_available && <span className="rounded-full bg-brand-card px-3 py-1 text-sm text-brand-charcoal" data-testid={`event-replay-${event.id}`}><PlayCircle className="mr-1 inline" size={14} /> Replay</span>}</div><div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => rsvp(event.id)} data-testid={`event-rsvp-button-${event.id}`} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">RSVP</Button><Button onClick={() => attend(event.id)} data-testid={`event-attend-button-${event.id}`} variant="outline" className="rounded-full border-brand-border bg-white">Mark attended</Button></div></article>)}
      </div>
    </PageShell>
  );
}