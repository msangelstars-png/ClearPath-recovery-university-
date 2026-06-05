import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function CourseDetail() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);
  const [answers, setAnswers] = useState({});
  const [reflections, setReflections] = useState({});
  const [result, setResult] = useState(null);
  const load = async () => setData((await platformApi.course(courseId)).data);
  useEffect(() => { load(); }, [courseId]);
  const complete = async (lesson) => {
    const quiz_answers = lesson.quiz.map((_, idx) => Number(answers[`${lesson.id}-${idx}`] || 0));
    const { data: res } = await platformApi.completeLesson(lesson.id, { quiz_answers, reflection: reflections[lesson.id] || "" });
    setResult(res);
    load();
  };
  if (!data) return <PageShell title="Course"><div data-testid="course-loading-state">Loading course…</div></PageShell>;
  const completed = new Set(data.enrollment?.completed_lessons || []);
  return (
    <PageShell eyebrow={data.course.instructor_ai} title={data.course.title} action={<Button asChild variant="outline" data-testid="back-to-schools-button" className="rounded-full border-brand-border bg-white"><Link to="/schools">Back to schools</Link></Button>}>
      <div className="mb-6 rounded-2xl border border-brand-border bg-white p-6" data-testid="course-progress-card">
        <p className="text-sm text-brand-muted" data-testid="course-summary-text">{data.course.summary}</p>
        <div className="mt-5 flex items-center gap-4"><Progress value={data.enrollment?.progress_percentage || 0} data-testid="course-progress-bar" /><span className="font-heading text-xl text-brand-dark" data-testid="course-progress-value">{data.enrollment?.progress_percentage || 0}%</span></div>
      </div>
      {result?.certificate && <div className="mb-6 rounded-2xl border border-brand-success/30 bg-green-50 p-5 text-brand-success" data-testid="certificate-earned-message"><Award className="mb-2" /> Certificate earned for {result.certificate.course_title}</div>}
      <div className="space-y-6" data-testid="lessons-list">
        {data.lessons.map((lesson) => (
          <article key={lesson.id} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`lesson-card-${lesson.id}`}>
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid={`lesson-title-${lesson.id}`}>{lesson.title}</h2><p className="mt-3 leading-relaxed text-brand-charcoal" data-testid={`lesson-content-${lesson.id}`}>{lesson.content}</p></div>
              {completed.has(lesson.id) && <CheckCircle2 className="shrink-0 text-brand-success" data-testid={`lesson-complete-icon-${lesson.id}`} />}
            </div>
            <div className="mt-6 rounded-xl bg-brand-card p-4" data-testid={`lesson-reflection-box-${lesson.id}`}>
              <label className="text-sm font-medium text-brand-charcoal" htmlFor={`reflection-${lesson.id}`}>{lesson.reflection_prompt}</label>
              <Textarea id={`reflection-${lesson.id}`} data-testid={`lesson-reflection-input-${lesson.id}`} value={reflections[lesson.id] || ""} onChange={(e) => setReflections({ ...reflections, [lesson.id]: e.target.value })} className="mt-3 rounded-xl border-brand-border bg-white" />
            </div>
            <div className="mt-5 space-y-4" data-testid={`lesson-quiz-${lesson.id}`}>
              {lesson.quiz.map((question, index) => <div key={question.question}><p className="text-sm font-medium text-brand-dark" data-testid={`quiz-question-${lesson.id}-${index}`}>{question.question}</p><div className="mt-2 flex flex-wrap gap-2">{question.options.map((option, optionIndex) => <button key={option} onClick={() => setAnswers({ ...answers, [`${lesson.id}-${index}`]: optionIndex })} data-testid={`quiz-option-${lesson.id}-${index}-${optionIndex}`} className={`rounded-full border px-3 py-2 text-sm ${Number(answers[`${lesson.id}-${index}`]) === optionIndex ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal"}`}>{option}</button>)}</div></div>)}
            </div>
            <Button onClick={() => complete(lesson)} data-testid={`complete-lesson-button-${lesson.id}`} className="mt-5 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Complete lesson</Button>
          </article>
        ))}
      </div>
    </PageShell>
  );
}