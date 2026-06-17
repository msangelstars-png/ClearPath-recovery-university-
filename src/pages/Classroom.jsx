import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Captions, MessageSquare, PlayCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { LIVE_CLASSES } from '@/data/platform';

export default function Classroom() {
  const { classId } = useParams();
  const { currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [question, setQuestion] = useState('');
  const [message, setMessage] = useState('');
  const [attended, setAttended] = useState(false);
  const [completed, setCompleted] = useState(false);

  const item = LIVE_CLASSES.find((c) => c.id === classId);

  useEffect(() => {
    supabase.from('class_questions').select('*').eq('user_id', currentUser.id).eq('class_id', classId)
      .order('created_at', { ascending: true }).then(({ data }) => setQuestions(data || []));
    supabase.from('class_attendances').select('*').eq('user_id', currentUser.id).eq('class_id', classId)
      .maybeSingle().then(({ data }) => { if (data) { setAttended(data.joined); setCompleted(data.completed); } });
  }, [classId]);

  const join = async () => {
    await supabase.from('class_attendances').upsert({ user_id: currentUser.id, class_id: classId, joined: true }, { onConflict: 'user_id,class_id' });
    setAttended(true);
    setMessage('Attendance saved. You can leave and continue later from any device.');
  };

  const complete = async () => {
    await supabase.from('class_attendances').upsert({ user_id: currentUser.id, class_id: classId, joined: true, completed: true }, { onConflict: 'user_id,class_id' });
    setCompleted(true);
    setMessage('Class completed. A downloadable certificate has been added.');
  };

  const ask = async () => {
    if (!question.trim()) return;
    const answer = `${item?.professor?.name || 'Your professor'} will respond with personalized guidance based on your recovery journey and the class content.`;
    const { data } = await supabase.from('class_questions').insert({ class_id: classId, question: question.trim(), answer, language: 'en' }).select().maybeSingle();
    setQuestions((prev) => [...prev, data]);
    setQuestion('');
  };

  if (!item) return <PageShell title="Classroom"><p className="text-brand-muted">Class not found.</p></PageShell>;

  return (
    <PageShell eyebrow={item.professor.name} title={item.title}>
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success">{message}</div>}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2">
          <div className="aspect-video rounded-2xl bg-brand-dark p-6 text-white">
            <Video className="mb-4" />
            <h2 className="font-heading text-3xl">{item.professor.avatar} {item.professor.name}</h2>
            <p className="mt-3 text-white/80">{item.professor.teaching_style}</p>
            <p className="mt-6 rounded-xl bg-white/10 p-4">
              <Captions className="mr-2 inline" /> Captions and transcript are available in all supported languages.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={join} disabled={attended} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
              {attended ? 'Attendance saved' : 'Join / mark attendance'}
            </Button>
            <Button onClick={complete} disabled={completed} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
              {completed ? 'Completed' : 'Complete class'}
            </Button>
          </div>
          <section className="mt-6 rounded-xl bg-brand-card p-5">
            <h3 className="font-heading text-2xl text-brand-dark">Written lesson version</h3>
            <p className="mt-2 text-brand-charcoal">{item.text_lesson}</p>
          </section>
          <section className="mt-6 rounded-xl bg-brand-card p-5">
            <h3 className="font-heading text-2xl text-brand-dark"><PlayCircle className="mr-2 inline text-brand-primary" /> Replay and transcript</h3>
            <p className="mt-2 text-brand-charcoal">{item.transcript}</p>
          </section>
        </section>

        <aside className="rounded-2xl border border-brand-border bg-white p-6">
          <h2 className="font-heading text-2xl text-brand-dark"><MessageSquare className="mr-2 inline text-brand-primary" /> Ask during class</h2>
          <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="mt-4 rounded-xl border-brand-border" placeholder="Ask a personalized question…" />
          <Button onClick={ask} disabled={!question.trim()} className="mt-3 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Ask professor</Button>
          <div className="mt-5 space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="rounded-xl bg-brand-card p-3">
                <p className="text-sm font-medium text-brand-dark">{q.question}</p>
                <p className="mt-2 text-sm text-brand-muted">{q.answer}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
