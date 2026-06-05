import { useEffect, useState } from "react";
import { FileUp, LifeBuoy, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Tickets() {
  const [config, setConfig] = useState({ categories: [], priorities: [], languages: [] });
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ category: "Technical Issues", priority: "Normal", subject: "", message: "", language: "en", attachments: [] });
  const [attachment, setAttachment] = useState("");
  const [message, setMessage] = useState("");
  const load = async () => { const [cfg, list] = await Promise.all([platformApi.supportConfig(), platformApi.tickets()]); setConfig(cfg.data); setTickets(list.data.tickets); };
  useEffect(() => { load(); }, []);
  const create = async () => {
    const attachments = attachment ? [{ name: attachment, url: attachment, type: "link" }] : [];
    const { data } = await platformApi.createTicket({ ...form, attachments });
    setMessage(`Ticket ${data.ticket.ticket_number} created and saved to your account.`);
    setForm({ ...form, subject: "", message: "" });
    setAttachment("");
    load();
  };
  return (
    <PageShell eyebrow="Human support tickets" title="Get help from ClearPath support">
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success" data-testid="ticket-success-message">{message}</div>}
      <div className="grid gap-6 lg:grid-cols-2" data-testid="tickets-grid">
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="create-ticket-card">
          <LifeBuoy className="mb-3 text-brand-primary" /><h2 className="font-heading text-2xl text-brand-dark">Create support ticket</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2"><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="ticket-category-select" className="rounded-xl border border-brand-border p-3">{config.categories.map((item) => <option key={item}>{item}</option>)}</select><select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} data-testid="ticket-priority-select" className="rounded-xl border border-brand-border p-3">{config.priorities.map((item) => <option key={item}>{item}</option>)}</select></div>
          <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" data-testid="ticket-subject-input" className="mt-3 rounded-xl border-brand-border" />
          <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us what happened…" data-testid="ticket-message-input" className="mt-3 rounded-xl border-brand-border" />
          <div className="mt-3 flex items-center gap-2"><FileUp className="text-brand-primary" /><Input value={attachment} onChange={(e) => setAttachment(e.target.value)} placeholder="Screenshot/video/file URL" data-testid="ticket-attachment-input" className="rounded-xl border-brand-border" /></div>
          <Button onClick={create} disabled={!form.subject || !form.message} data-testid="create-ticket-button" className="mt-4 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Submit ticket</Button>
        </section>
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="ticket-history-card">
          <Ticket className="mb-3 text-brand-primary" /><h2 className="font-heading text-2xl text-brand-dark">Ticket history</h2>
          <div className="mt-4 space-y-3">{tickets.map((ticket) => <article key={ticket.id} className="rounded-xl bg-brand-card p-4" data-testid={`ticket-row-${ticket.id}`}><p className="font-medium text-brand-dark" data-testid={`ticket-number-${ticket.id}`}>{ticket.ticket_number}</p><p className="text-sm text-brand-muted" data-testid={`ticket-subject-${ticket.id}`}>{ticket.subject}</p><div className="mt-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-white px-2 py-1" data-testid={`ticket-status-${ticket.id}`}>{ticket.status}</span><span className="rounded-full bg-white px-2 py-1" data-testid={`ticket-priority-${ticket.id}`}>{ticket.priority}</span></div><p className="mt-2 text-sm text-brand-charcoal" data-testid={`ticket-ai-triage-${ticket.id}`}>{ticket.ai_triage}</p></article>)}</div>
        </section>
      </div>
    </PageShell>
  );
}