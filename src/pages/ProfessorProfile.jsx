import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, MessageSquare, PlayCircle, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PROFESSORS, COURSES } from '@/data/platform';
import EnrollmentPrompt from '@/components/EnrollmentPrompt';

export default function ProfessorProfile() {
  const { professorId } = useParams();
  const { currentUser } = useAuth();
  const professor = PROFESSORS.find((p) => p.id === professorId);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (!professor || !currentUser || !showChat) return;
    supabase
      .from('ai_messages')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('professor_id', professor.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages(data || []));
  }, [professor, currentUser, showChat]);

  if (!professor) {
    return (
      <PageShell eyebrow="Professor not found" title="Unknown professor">
        <div className="rounded-2xl border border-brand-border bg-white p-8 text-center">
          <p className="text-brand-muted">This professor does not exist.</p>
          <Button asChild className="mt-4 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
            <Link to="/professors">Browse faculty</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const professorCourses = COURSES.filter((c) => professor.courses?.includes(c.id));

  const send = async () => {
    if (!text.trim() || !currentUser) return;
    const prompt = text.trim();
    setText('');
    setMessages((prev) => [...prev, { role: 'user', content: prompt }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      await supabase.from('ai_messages').insert({ user_id: currentUser.id, professor_id: professor.id, role: 'user', content: prompt });
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || anonKey;

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-professor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'apikey': anonKey },
        body: JSON.stringify({
          professor_id: professor.id, professor_name: professor.name,
          professor_focus: professor.focus, professor_style: professor.teaching_style,
          message: prompt, user_name: currentUser.display_name,
        }),
      });

      if (!response.ok) throw new Error('Unavailable');
      const result = await response.json();
      const reply = result.reply || 'I hear you. Your next right step can still be small.';
      await supabase.from('ai_messages').insert({ user_id: currentUser.id, professor_id: professor.id, role: 'assistant', content: reply });
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev.slice(0, -1), { role: 'assistant', content: `${professor.name} here. I'm having trouble connecting right now. Please try again shortly.` }]);
      setError('Could not connect. Please try again.');
    } finally {
      setStreaming(false);
    }
  };

  return (
    <PageShell eyebrow={professor.school} title={`${professor.avatar} ${professor.name}`}>
      <Link to="/professors" className="mb-6 inline-flex items-center gap-1.5 text-sm text-brand-primary hover:text-brand-primaryHover">
        <ArrowLeft size={15} /> All professors
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5">
          <div className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-card text-5xl">
              {professor.avatar}
            </div>
            <h2 className="font-heading text-2xl font-medium text-brand-dark">{professor.name}</h2>
            <p className="mt-1 text-sm font-medium text-brand-primary">{professor.focus}</p>
            <p className="mt-1 text-sm text-brand-muted">{professor.personality} · {professor.voice}</p>
          </div>

          {professor.video_url && (
            <div className="overflow-hidden rounded-2xl border border-brand-border bg-black">
              <iframe
                src={professor.video_url}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${professor.name} introduction video`}
              />
            </div>
          )}

          <div className="rounded-2xl border border-brand-border bg-white p-6">
            <h3 className="mb-3 font-heading text-lg font-medium text-brand-dark">Specialties</h3>
            <div className="flex flex-wrap gap-2">
              {professor.specialties.map((s) => (
                <span key={s} className="rounded-full bg-brand-card px-3 py-1.5 text-sm text-brand-charcoal">{s}</span>
              ))}
            </div>
          </div>

          {professorCourses.length > 0 && (
            <div className="rounded-2xl border border-brand-border bg-white p-6">
              <h3 className="mb-3 font-heading text-lg font-medium text-brand-dark">Assigned courses</h3>
              <div className="space-y-2">
                {professorCourses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="flex items-center gap-3 rounded-xl bg-brand-card p-3 text-sm text-brand-charcoal hover:text-brand-primary transition-colors"
                  >
                    <BookOpen size={15} className="text-brand-primary" />
                    <div>
                      <p className="font-medium">{course.title}</p>
                      <p className="text-xs text-brand-muted">{course.difficulty}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={() => setShowChat(true)}
            className="w-full rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"
          >
            <MessageSquare size={16} /> Chat with {professor.name.split(' ').pop()}
          </Button>
        </div>

        <div className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2">
          <div className="mb-5">
            <h3 className="font-heading text-2xl text-brand-dark">About</h3>
            <p className="mt-3 text-brand-charcoal leading-relaxed">{professor.bio}</p>
          </div>

          <div className="mb-5 rounded-xl bg-brand-card p-4">
            <Sparkles className="mb-2 text-brand-primary" size={18} />
            <p className="text-sm text-brand-charcoal">
              {professor.name} remembers your profile, goals, progress, and prior conversations. Each session builds on the last.
            </p>
          </div>

          {showChat && (
            <>
              <div className="mb-4 rounded-xl border border-brand-border bg-brand-base p-4">
                <h4 className="mb-3 font-heading text-lg text-brand-dark">Conversation</h4>
                {!currentUser && <EnrollmentPrompt />}
                {currentUser && messages.length === 0 && (
                  <p className="text-sm text-brand-muted">Ask about your roadmap, a lesson, a difficult moment, or the next right step.</p>
                )}
                <div className="space-y-3 min-h-[200px]">
                  {messages.map((msg, index) => (
                    <div
                      key={`${msg.role}-${index}`}
                      className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed ${msg.role === 'user' ? 'ml-auto bg-brand-primary text-white' : 'bg-white text-brand-charcoal border border-brand-border'}`}
                    >
                      {msg.content || <span className="italic text-brand-muted">Thinking with care...</span>}
                    </div>
                  ))}
                </div>
              </div>

              {currentUser && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder={`Ask ${professor.name.split(' ').pop()} for guidance...`}
                    className="min-h-[76px] rounded-xl border-brand-border bg-white"
                  />
                  <Button onClick={send} disabled={streaming || !text.trim()} className="rounded-full bg-brand-primary px-6 text-white hover:bg-brand-primaryHover">
                    <Send size={17} /> Send
                  </Button>
                </div>
              )}
            </>
          )}

          {!showChat && (
            <div className="rounded-xl border border-dashed border-brand-border p-8 text-center">
              <GraduationCap className="mx-auto mb-3 text-brand-primary" size={32} />
              <p className="font-heading text-lg text-brand-dark">Ready to talk?</p>
              <p className="mt-1 text-sm text-brand-muted">Start a conversation with {professor.name} for personalized guidance.</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
