import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';

const STATUS_COLORS = {
  open: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-600',
};

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('open');
  const [responding, setResponding] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    const query = supabase
      .from('support_tickets')
      .select('*, profiles(display_name, email)')
      .order('created_at', { ascending: false });
    if (filter !== 'all') query.eq('status', filter);
    const { data } = await query;
    setTickets(data || []);
  };

  useEffect(() => { load(); }, [filter]);

  const respond = async (ticket) => {
    if (!responseText.trim()) return;
    setSaving(true);
    await supabase.from('support_tickets').update({
      response: responseText.trim(),
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    }).eq('id', ticket.id);
    setSaving(false);
    setResponding(null);
    setResponseText('');
    setMessage(`Ticket resolved and response sent to ${ticket.profiles?.display_name || 'user'}.`);
    load();
  };

  const updateStatus = async (id, status) => {
    await supabase.from('support_tickets').update({ status }).eq('id', id);
    load();
  };

  return (
    <PageShell eyebrow="Admin — support queue" title="Support ticket management">
      {message && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-brand-border bg-white p-4 text-brand-success">
          <CheckCircle2 size={18} /> {message}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {['open', 'resolved', 'closed', 'all'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-brand-primary text-white' : 'bg-white border border-brand-border text-brand-charcoal hover:bg-brand-card'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-white p-12 text-center">
          <MessageSquare className="mx-auto mb-4 text-brand-primary" size={40} />
          <p className="font-heading text-xl text-brand-dark">No {filter} tickets</p>
        </div>
      ) : (
        <div className="space-y-5">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-2xl border border-brand-border bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">{ticket.category}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[ticket.status] || STATUS_COLORS.open}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <h2 className="mt-1 font-heading text-xl text-brand-dark">{ticket.subject}</h2>
                  <p className="mt-0.5 text-sm text-brand-muted">
                    From: {ticket.profiles?.display_name || 'Unknown'} ({ticket.profiles?.email})
                  </p>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-brand-muted">
                  <Clock size={13} /> {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>

              <p className="mt-4 rounded-xl bg-brand-card p-4 text-sm text-brand-charcoal">{ticket.message}</p>

              {ticket.response && (
                <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="text-xs font-semibold text-green-700">Response sent</p>
                  <p className="mt-1 text-sm text-brand-charcoal">{ticket.response}</p>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {ticket.status === 'open' && (
                  <>
                    <Button
                      onClick={() => { setResponding(ticket.id); setResponseText(''); }}
                      size="sm"
                      className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"
                    >
                      <MessageSquare size={14} /> Respond
                    </Button>
                    <Button
                      onClick={() => updateStatus(ticket.id, 'closed')}
                      size="sm"
                      variant="outline"
                      className="rounded-full border-brand-border"
                    >
                      Close
                    </Button>
                  </>
                )}
                {ticket.status === 'resolved' && (
                  <Button
                    onClick={() => updateStatus(ticket.id, 'closed')}
                    size="sm"
                    variant="outline"
                    className="rounded-full border-brand-border"
                  >
                    Close ticket
                  </Button>
                )}
              </div>

              {responding === ticket.id && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    rows={4}
                    placeholder="Write your response..."
                    className="w-full rounded-xl border border-brand-border bg-brand-base px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => respond(ticket)}
                      disabled={saving}
                      size="sm"
                      className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"
                    >
                      {saving ? 'Sending...' : 'Send & resolve'}
                    </Button>
                    <Button
                      onClick={() => setResponding(null)}
                      size="sm"
                      variant="outline"
                      className="rounded-full border-brand-border"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
