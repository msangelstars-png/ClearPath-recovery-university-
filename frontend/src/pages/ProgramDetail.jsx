import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ClipboardCheck, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import EnrollmentPrompt from "@/components/EnrollmentPrompt";

export default function ProgramDetail() {
  const { user } = useAuth();
  const { programId } = useParams();
  const [data, setData] = useState(null);
  const [responses, setResponses] = useState({});
  const [message, setMessage] = useState("");
  const load = async () => {
    if (user) setData((await platformApi.program(programId)).data);
    else {
      const { data } = await platformApi.publicPreview();
      const program = data.programs.find((item) => item.id === programId);
      setData({ program: program ? { ...program, tracks: [] } : null, submissions: [] });
    }
  };
  useEffect(() => { load(); }, [programId]);
  const submit = async (track, module, assignment) => {
    const { data: res } = await platformApi.submitAssignment({ program_id: programId, track_id: track.id, module_id: module.id, assignment_id: assignment.id, text_response: responses[assignment.id] || "Completed through classroom practice.", file_ids: [], language: "en" });
    setMessage(`Assignment submitted. Track progress is now ${res.progress_percentage}%.`);
    load();
  };
  if (!data) return <PageShell title="Program"><div data-testid="program-loading-state">Loading semester program…</div></PageShell>;
  const program = data.program;
  if (!program) return <PageShell title="Program preview"><EnrollmentPrompt /></PageShell>;
  if (!user) return <PageShell eyebrow="Program preview" title={program.school_name}><section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="program-public-preview"><p className="text-brand-charcoal" data-testid="program-preview-description">{program.description}</p><p className="mt-3 text-sm text-brand-muted" data-testid="program-preview-professor">Professor: {program.professor}</p><p className="mt-3 text-sm text-brand-muted" data-testid="program-preview-pathway">Graduation pathway: {(program.graduation_pathway || []).join(" → ")}</p></section><div className="mt-6"><EnrollmentPrompt text="Create your free account to unlock modules, full lessons, quizzes, assignments, certificates, and progress tracking." /></div></PageShell>;
  return (
    <PageShell eyebrow={program.professor} title={program.school_name}>
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success" data-testid="assignment-submit-message">{message}</div>}
      <div className="space-y-6" data-testid="program-detail-tracks">
        {program.tracks.map((track) => <section key={track.id} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`track-section-${track.id}`}><h2 className="font-heading text-3xl text-brand-dark" data-testid={`track-title-${track.id}`}>{track.name} Track</h2><p className="mt-2 text-sm text-brand-muted" data-testid={`track-requirement-${track.id}`}>{track.graduation_requirement}</p><div className="mt-5 grid gap-4 md:grid-cols-2">{track.modules.map((module) => <article key={module.id} className="rounded-xl bg-brand-card p-4" data-testid={`module-card-${module.id}`}><h3 className="font-heading text-xl text-brand-dark" data-testid={`module-title-${module.id}`}>{module.title}</h3><p className="mt-2 text-sm text-brand-charcoal" data-testid={`module-lesson-${module.id}`}>{module.lessons[0].content}</p><div className="mt-3 rounded-lg bg-white p-3 text-sm text-brand-muted" data-testid={`module-quiz-${module.id}`}><ClipboardCheck className="mr-2 inline text-brand-primary" size={16} /> Quiz: {module.lessons[0].quiz[0].question}</div>{module.assignments.map((assignment) => <div key={assignment.id} className="mt-3" data-testid={`assignment-box-${assignment.id}`}><p className="text-sm font-medium text-brand-dark">{assignment.title}</p><Textarea value={responses[assignment.id] || ""} onChange={(e) => setResponses({ ...responses, [assignment.id]: e.target.value })} data-testid={`assignment-response-${assignment.id}`} className="mt-2 rounded-xl border-brand-border bg-white" placeholder={assignment.prompt} /><Button onClick={() => submit(track, module, assignment)} data-testid={`submit-assignment-${assignment.id}`} className="mt-2 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><FileUp size={16} /> Submit assignment</Button></div>)}</article>)}</div></section>)}
      </div>
    </PageShell>
  );
}