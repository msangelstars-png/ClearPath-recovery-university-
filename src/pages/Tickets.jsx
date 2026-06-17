import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, MessageSquare, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { SUPPORT_INFO } from '@/data/platform';

const CATEGORIES = ['Account access', 'Course progress', 'AI professor', 'Subscription & billing', 'Certificate', 'Technical issue', 'Other'];
const STATUS_COLORS = { open: 'bg-amber-100 text-amber-700', resolved: 'bg-green-100 text-green-700', closed: 'bg-slate-100 text-slate-600' };

export default function Tickets() {
  const { currentUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    setTickets(data || []);
  };

  useEffect(() => { load(); }, [currentUser]);

  const submit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) { setError('Subject and message are required.'); return; }
    setSaving(true);
    setError('');
    const { error: err } = await supabase.from('support_tickets').insert({
      subject: subject.trim(),
      category,
      message: message.trim(),
      status: 'open',
    });
    setSaving(false);
    if (err) { setError('Could not submit ticket. Please try again.'); return; }
    setSuccess('Ticket submitted. We typically respond within 1 business day.');
    setShowForm(false);
    setSubject('');
    setMessage('');
    setCategory(CATEGORIES[0]);
    load();
  };

  return (
    <PageShell
      eyebrow="Support tickets"
      title="Get help"
      action={
        <Button onClick={() => setShowForm(!showForm)} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New ticket'}
        </Button>
      }
    >
      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-4 text-brand-success">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error">{error}</div>
      )}

      {showForm && (
        <form onSubmit={submit} className="mb-8 rounded-2xl border border-brand-border bg-white p-6">
          <h2 className="mb-5 font-heading text-2xl text-brand-dark">New support ticket</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-dark">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-brand-border bg-brand-base px-4 py-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-dark">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief description of your issue"
                className="w-full rounded-xl border border-brand-border bg-brand-base px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-brand-dark">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Describe what you need help with in as much detail as possible..."
                className="w-full rounded-xl border border-brand-border bg-brand-base px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <Button type="submit" disabled={saving} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
              {saving ? 'Submitting...' : 'Submit ticket'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="rounded-full border-brand-border">
              Cancel
            </Button>
          </div>
        </form>
      )}

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-white p-12 text-center">
          <MessageSquare className="mx-auto mb-4 text-brand-primary" size={40} />
          <p className="font-heading text-xl text-brand-dark">No tickets yet</p>
          <p className="mt-2 text-brand-muted">Have a question or issue? Open a ticket and our team will respond within 1 business day.</p>
          <Button onClick={() => setShowForm(true)} className="mt-5 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
            <Plus size={16} /> Create your first ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-2xl border border-brand-border bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{ticket.category}</p>
                  <h2 className="mt-1 font-heading text-xl text-brand-dark">{ticket.subject}</h2>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-brand-charcoal">{ticket.message}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-brand-muted">
                <Clock size={13} /> Submitted {new Date(ticket.created_at).toLocaleDateString()}
              </p>
              {ticket.response && (
                <div className="mt-4 rounded-xl bg-brand-card p-4">
                  <p className="text-xs font-semibold text-brand-primary">Support response</p>
                  <p className="mt-1 text-sm text-brand-charcoal">{ticket.response}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-brand-border bg-white p-6">
        <p className="font-medium text-brand-dark">Need faster help?</p>
        <p className="mt-1 text-sm text-brand-charcoal">{SUPPORT_INFO.contact} · {SUPPORT_INFO.phone}</p>
        <p className="text-sm text-brand-muted">{SUPPORT_INFO.hours}</p>
        <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">{SUPPORT_INFO.crisis_note}</p>
      </div>
    </PageShell>
  );
}
