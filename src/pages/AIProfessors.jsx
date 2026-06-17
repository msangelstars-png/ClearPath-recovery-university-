import { useEffect, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PROFESSORS } from '@/data/platform';
import EnrollmentPrompt from '@/components/EnrollmentPrompt';

export default function AIProfessors() {
  const { currentUser } = useAuth();
  const [active, setActive] = useState(PROFESSORS[0]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!active || !currentUser) return;
    supabase
      .from('ai_messages')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('professor_id', active.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data || []);
        setError('');
      })
      .catch(() => setError('Professor history could not load.'));
  }, [active, currentUser]);

  const send = async () => {
    if (!text.trim()) return;
    if (!currentUser) { setError('Create your free account to chat with a professor.'); return; }

    const prompt = text.trim();
    setText('');

    const userMsg = { role: 'user', content: prompt };
    const assistantPlaceholder = { role: 'assistant', content: '' };
    setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
    setStreaming(true);

    try {
      await supabase.from('ai_messages').insert({ user_id: currentUser.id, professor_id: active.id, role: 'user', content: prompt });

      // Call the edge function for AI response
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || anonKey;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-professor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          professor_id: active.id,
          professor_name: active.name,
          professor_focus: active.focus,
          professor_style: active.teaching_style,
          message: prompt,
          user_name: currentUser.display_name,
        }),
      });

      if (!response.ok) throw new Error('Professor is temporarily unavailable.');

      const result = await response.json();
      const reply = result.reply || 'I hear you. Your next right step can still be small — breathe, name one need, and return when ready.';

      await supabase.from('ai_messages').insert({ user_id: currentUser.id, professor_id: active.id, role: 'assistant', content: reply });

      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: reply }]);
      setError('');
    } catch {
      const fallback = `${active.name} here. I'm having trouble connecting right now, but your courage in reaching out matters. Your next step can be small: breathe, write one thing you need, and return when ready.`;
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: fallback }]);
      setError('The professor could not respond right now. Please try again shortly.');
    } finally {
      setStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <PageShell eyebrow="AI Professor system" title="Ask a professor who remembers your path">
      <div className="grid gap-6 lg:grid-cols-4">
        <aside className="rounded-2xl border border-brand-border bg-white p-4">
          {PROFESSORS.map((professor) => (
            <button
              key={professor.id}
              onClick={() => { setActive(professor); setMessages([]); }}
              className={`mb-3 w-full rounded-xl border p-4 text-left transition-colors ${active.id === professor.id ? 'border-brand-primary bg-brand-card' : 'border-brand-border bg-white hover:bg-brand-card'}`}
            >
              <p className="font-heading text-lg text-brand-dark">{professor.avatar} {professor.name}</p>
              <p className="text-sm text-brand-muted">{professor.school}</p>
              <p className="mt-1 text-xs text-brand-muted">{professor.teaching_style}</p>
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-brand-border bg-white p-5 lg:col-span-3">
          <div className="mb-5 rounded-xl bg-brand-card p-4">
            <Sparkles className="mb-2 text-brand-primary" />
            <h2 className="font-heading text-2xl font-medium text-brand-dark">{active.avatar} {active.name}</h2>
            <p className="text-sm text-brand-muted">{active.personality} · {active.voice}</p>
            <p className="mt-2 text-sm text-brand-charcoal">Remembers your profile, goals, progress, completed coursework, and prior conversations.</p>
          </div>

          {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-brand-error">{error}</p>}
          {!currentUser && <div className="mb-4"><EnrollmentPrompt /></div>}

          <div className="min-h-[360px] space-y-4 rounded-xl border border-brand-border bg-brand-base p-4">
            {messages.length === 0 && (
              <p className="text-brand-muted">Ask about your roadmap, a lesson, a difficult moment, or the next right step.</p>
            )}
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-brand-primary text-white' : 'bg-white text-brand-charcoal'}`}
              >
                {message.content || <span className="italic text-brand-muted">Thinking with care…</span>}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for guidance…"
              className="min-h-[76px] rounded-xl border-brand-border bg-white"
            />
            <Button onClick={send} disabled={streaming || !text.trim()} className="rounded-full bg-brand-primary px-6 text-white hover:bg-brand-primaryHover">
              <Send size={17} /> Send
            </Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
