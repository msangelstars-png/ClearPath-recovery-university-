import { useEffect, useState } from "react";
import { MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [notes, setNotes] = useState({});
  const load = async () => setTickets((await platformApi.adminTickets()).data.tickets);
  useEffect(() => { load(); }, []);
  const update = async (ticket, status) => { await platformApi.adminUpdateTicket(ticket.id, { status, internal_note: notes[ticket.id] || "Reviewed by support" }); setNotes({ ...notes, [ticket.id]: "" }); load(); };
  return (
    <PageShell eyebrow="Support agent dashboard" title="Contact center inbox">
      <div className="space-y-5" data-testid="admin-support-ticket-list">
        {tickets.map((ticket) => <article key={ticket.id} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`admin-support-ticket-${ticket.id}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid={`admin-ticket-number-${ticket.id}`}>{ticket.ticket_number}</p><h2 className="mt-2 font-heading text-2xl text-brand-dark" data-testid={`admin-ticket-subject-${ticket.id}`}>{ticket.subject}</h2><p className="mt-1 text-sm text-brand-muted" data-testid={`admin-ticket-meta-${ticket.id}`}>{ticket.category} · {ticket.priority} · {ticket.status}</p></div><MessageSquareText className="text-brand-primary" /></div><p className="mt-4 text-brand-charcoal" data-testid={`admin-ticket-message-${ticket.id}`}>{ticket.message}</p><Textarea value={notes[ticket.id] || ""} onChange={(e) => setNotes({ ...notes, [ticket.id]: e.target.value })} data-testid={`admin-ticket-note-${ticket.id}`} className="mt-4 rounded-xl border-brand-border" placeholder="Internal note…" /><div className="mt-3 flex flex-wrap gap-2"><Button onClick={() => update(ticket, "In Review")} data-testid={`admin-ticket-review-${ticket.id}`} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">In Review</Button><Button onClick={() => update(ticket, "Waiting for Student")} data-testid={`admin-ticket-waiting-${ticket.id}`} variant="outline" className="rounded-full border-brand-border bg-white">Waiting</Button><Button onClick={() => update(ticket, "Resolved")} data-testid={`admin-ticket-resolve-${ticket.id}`} variant="outline" className="rounded-full border-brand-border bg-white">Resolved</Button></div></article>)}
      </div>
    </PageShell>
  );
}