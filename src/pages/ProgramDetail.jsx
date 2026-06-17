import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ClipboardCheck, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PROGRAMS } from '@/data/platform';
import EnrollmentPrompt from '@/components/EnrollmentPrompt';

export default function ProgramDetail() {
  const { programId } = useParams();
  const { currentUser } = useAuth();
  const [responses, setResponses] = useState({});
  const [message, setMessage] = useState('');

  const program = PROGRAMS.find((p) => p.id === programId);

  if (!program) return (
    <PageShell title="Program preview">
      <EnrollmentPrompt title="Program not found or not yet available." text="More programs are coming soon." />
    </PageShell>
  );

  if (!currentUser) return (
    <PageShell eyebrow="Program preview" title={program.school_name}>
      <section className="rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-brand-charcoal">{program.description}</p>
        <p className="mt-3 text-sm text-brand-muted">Professor: {program.professor}</p>
        <p className="mt-3 text-sm text-brand-muted">Graduation pathway: {(program.graduation_pathway || []).join(' → ')}</p>
      </section>
      <div className="mt-6">
        <EnrollmentPrompt text="Create your free account to unlock modules, full lessons, quizzes, assignments, certificates, and progress tracking." />
      </div>
    </PageShell>
  );

  const submit = async (assignmentId) => {
    await supabase.from('assignment_submissions').insert({
      program_id: programId,
      track_id: 'track-1',
      module_id: 'mod-1',
      assignment_id: assignmentId,
      text_response: responses[assignmentId] || 'Completed through classroom practice.',
    });
    setMessage('Assignment submitted successfully.');
    setResponses({ ...responses, [assignmentId]: '' });
  };

  return (
    <PageShell eyebrow={program.professor} title={program.school_name}>
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success">{message}</div>}
      <div className="space-y-6">
        {program.tracks.map((track) => (
          <section key={track.id} className="rounded-2xl border border-brand-border bg-white p-6">
            <h2 className="font-heading text-3xl text-brand-dark">{track.name} Track</h2>
            <p className="mt-2 text-sm text-brand-muted">{track.graduation_requirement}</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {track.modules.map((module) => (
                <article key={module.id} className="rounded-xl bg-brand-card p-4">
                  <h3 className="font-heading text-xl text-brand-dark">{module.title}</h3>
                  <p className="mt-2 text-sm text-brand-charcoal">{module.lessons[0]?.content?.slice(0, 120)}…</p>
                  {module.lessons[0]?.quiz?.[0] && (
                    <div className="mt-3 rounded-lg bg-white p-3 text-sm text-brand-muted">
                      <ClipboardCheck className="mr-2 inline text-brand-primary" size={16} />
                      Quiz: {module.lessons[0].quiz[0].question}
                    </div>
                  )}
                  {module.assignments.map((assignment) => (
                    <div key={assignment.id} className="mt-3">
                      <p className="text-sm font-medium text-brand-dark">{assignment.title}</p>
                      <Textarea
                        value={responses[assignment.id] || ''}
                        onChange={(e) => setResponses({ ...responses, [assignment.id]: e.target.value })}
                        className="mt-2 rounded-xl border-brand-border bg-white"
                        placeholder={assignment.prompt}
                      />
                      <Button onClick={() => submit(assignment.id)} className="mt-2 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
                        <FileUp size={16} /> Submit assignment
                      </Button>
                    </div>
                  ))}
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
