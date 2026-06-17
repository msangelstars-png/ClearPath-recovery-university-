import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { COURSES, LESSONS } from '@/data/platform';

export default function CourseDetail() {
  const { courseId } = useParams();
  const { currentUser } = useAuth();
  const [enrollment, setEnrollment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [reflections, setReflections] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const course = COURSES.find((c) => c.id === courseId);
  const lessons = LESSONS[courseId] || [];

  const loadEnrollment = async () => {
    const { data } = await supabase
      .from('course_enrollments')
      .select('*')
      .eq('user_id', currentUser.id)
      .eq('course_id', courseId)
      .maybeSingle();
    setEnrollment(data);
    setLoading(false);
  };

  useEffect(() => { loadEnrollment(); }, [courseId]);

  const complete = async (lesson) => {
    const completed = new Set(enrollment?.completed_lessons || []);
    completed.add(lesson.id);
    const totalLessons = lessons.length;
    const progress = totalLessons > 0 ? Math.round((completed.size / totalLessons) * 100) : 0;

    const { data } = await supabase
      .from('course_enrollments')
      .upsert({
        user_id: currentUser.id,
        course_id: courseId,
        completed_lessons: Array.from(completed),
        progress_percentage: progress,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,course_id' })
      .select()
      .maybeSingle();

    setEnrollment(data);

    if (progress === 100) {
      const certCheck = await supabase.from('certificates').select('id').eq('user_id', currentUser.id).eq('course_id', courseId).maybeSingle();
      if (!certCheck.data) {
        await supabase.from('certificates').insert({ user_id: currentUser.id, course_id: courseId, course_title: course?.title || courseId });
        setResult({ certificate: { course_title: course?.title || courseId } });
      }
    }
  };

  if (!course) return <PageShell title="Course"><p className="text-brand-error">Course not found.</p></PageShell>;
  if (loading) return <PageShell title="Course"><div>Loading course…</div></PageShell>;

  const completed = new Set(enrollment?.completed_lessons || []);

  return (
    <PageShell
      eyebrow={course.instructor_ai}
      title={course.title}
      action={
        <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
          <Link to="/schools">Back to schools</Link>
        </Button>
      }
    >
      <div className="mb-6 rounded-2xl border border-brand-border bg-white p-6">
        <p className="text-sm text-brand-muted">{course.summary}</p>
        <div className="mt-5 flex items-center gap-4">
          <Progress value={enrollment?.progress_percentage || 0} className="flex-1 bg-brand-card" />
          <span className="font-heading text-xl text-brand-dark">{enrollment?.progress_percentage || 0}%</span>
        </div>
      </div>

      {result?.certificate && (
        <div className="mb-6 rounded-2xl border border-brand-success/30 bg-green-50 p-5 text-brand-success">
          <Award className="mb-2" /> Certificate earned for {result.certificate.course_title}
        </div>
      )}

      {lessons.length === 0 && (
        <div className="rounded-2xl border border-brand-border bg-white p-8 text-center text-brand-muted">
          Course content is being prepared. Check back soon.
        </div>
      )}

      <div className="space-y-6">
        {lessons.map((lesson) => (
          <article key={lesson.id} className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-heading text-2xl font-medium text-brand-dark">{lesson.title}</h2>
                <p className="mt-3 leading-relaxed text-brand-charcoal">{lesson.content}</p>
              </div>
              {completed.has(lesson.id) && <CheckCircle2 className="shrink-0 text-brand-success" />}
            </div>
            <div className="mt-6 rounded-xl bg-brand-card p-4">
              <label className="text-sm font-medium text-brand-charcoal">{lesson.reflection_prompt}</label>
              <Textarea
                value={reflections[lesson.id] || ''}
                onChange={(e) => setReflections({ ...reflections, [lesson.id]: e.target.value })}
                className="mt-3 rounded-xl border-brand-border bg-white"
              />
            </div>
            {lesson.quiz?.length > 0 && (
              <div className="mt-5 space-y-4">
                {lesson.quiz.map((question, index) => (
                  <div key={question.question}>
                    <p className="text-sm font-medium text-brand-dark">{question.question}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {question.options.map((option, optionIndex) => (
                        <button
                          key={option}
                          onClick={() => setAnswers({ ...answers, [`${lesson.id}-${index}`]: optionIndex })}
                          className={`rounded-full border px-3 py-2 text-sm ${Number(answers[`${lesson.id}-${index}`]) === optionIndex ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-border bg-white text-brand-charcoal'}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button
              onClick={() => complete(lesson)}
              disabled={completed.has(lesson.id)}
              className="mt-5 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"
            >
              {completed.has(lesson.id) ? 'Completed' : 'Complete lesson'}
            </Button>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
