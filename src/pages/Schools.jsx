import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { SCHOOLS, COURSES } from '@/data/platform';
import EnrollmentPrompt from '@/components/EnrollmentPrompt';
import { useEffect } from 'react';

export default function Schools() {
  const { currentUser } = useAuth();
  const [schoolEnrollments, setSchoolEnrollments] = useState([]);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [error, setError] = useState('');

  const loadEnrollments = async () => {
    if (!currentUser) return;
    const [se, ce] = await Promise.all([
      supabase.from('school_enrollments').select('school_id').eq('user_id', currentUser.id),
      supabase.from('course_enrollments').select('course_id').eq('user_id', currentUser.id),
    ]);
    setSchoolEnrollments((se.data || []).map((r) => r.school_id));
    setCourseEnrollments((ce.data || []).map((r) => r.course_id));
  };

  useEffect(() => { loadEnrollments(); }, [currentUser]);

  const enrollSchool = async (id) => {
    if (!currentUser) { setError('Create your free account to enroll.'); return; }
    const { error } = await supabase.from('school_enrollments').upsert({ user_id: currentUser.id, school_id: id }, { onConflict: 'user_id,school_id' });
    if (error) { setError('School enrollment could not be completed.'); return; }
    loadEnrollments();
  };

  const enrollCourse = async (id) => {
    if (!currentUser) { setError('Create your free account to enroll.'); return; }
    const course = COURSES.find((c) => c.id === id);
    if (course?.premium && currentUser.subscription_status === 'free') {
      const trialActive = currentUser.trial_ends_at && new Date(currentUser.trial_ends_at) > new Date();
      if (!trialActive) { setError('This course requires a Premium subscription.'); return; }
    }
    const { error } = await supabase.from('course_enrollments').upsert({ user_id: currentUser.id, course_id: id }, { onConflict: 'user_id,course_id' });
    if (error) { setError('Course enrollment could not be completed.'); return; }
    loadEnrollments();
  };

  const isPremiumLocked = (course) => {
    if (!currentUser || !course.premium) return false;
    if (currentUser.subscription_status !== 'free') return false;
    const trialActive = currentUser.trial_ends_at && new Date(currentUser.trial_ends_at) > new Date();
    return !trialActive;
  };

  return (
    <PageShell
      eyebrow="Schools and courses"
      title="Choose your next learning path"
      action={
        <Button asChild className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
          <Link to="/plans">View plans</Link>
        </Button>
      }
    >
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error">{error}</div>}
      {!currentUser && <div className="mb-6"><EnrollmentPrompt text="Browse schools and course previews now. Create your free account when you're ready to enroll, save progress, and unlock full lessons." /></div>}

      <div className="grid gap-6 lg:grid-cols-4">
        {SCHOOLS.map((school) => {
          const enrolled = schoolEnrollments.includes(school.id);
          return (
            <article key={school.id} className="overflow-hidden rounded-2xl border border-brand-border bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-md">
              <img src={school.image} alt={school.name} className="aspect-[4/3] w-full object-cover" />
              <div className="p-5">
                <School className="mb-3 text-brand-primary" size={22} />
                <h2 className="font-heading text-xl font-medium text-brand-dark">{school.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{school.description}</p>
                <p className="mt-4 text-sm font-medium text-brand-charcoal">{school.professor}</p>
                <Button
                  onClick={() => enrollSchool(school.id)}
                  disabled={enrolled}
                  className="mt-5 w-full rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"
                >
                  {currentUser ? (enrolled ? 'Enrolled' : 'Enroll in school') : 'Create account to enroll'}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-3xl font-semibold text-brand-dark">Course catalog</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {COURSES.map((course) => {
            const enrolled = courseEnrollments.includes(course.id);
            const locked = isPremiumLocked(course);
            return (
              <article key={course.id} className="rounded-2xl border border-brand-border bg-white p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-brand-card text-brand-charcoal hover:bg-brand-card">{course.difficulty}</Badge>
                  {course.premium && <Badge className="bg-brand-primary text-white hover:bg-brand-primary">Premium</Badge>}
                  {locked && <span className="inline-flex items-center gap-1 text-xs text-brand-muted"><Lock size={13} /> Locked</span>}
                </div>
                <h3 className="mt-4 font-heading text-2xl font-medium text-brand-dark">{course.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-muted">{course.summary}</p>
                <p className="mt-4 text-sm font-medium text-brand-charcoal">{course.instructor_ai}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  {enrolled ? (
                    <Button asChild className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
                      <Link to={`/courses/${course.id}`}><BookOpen size={16} /> Open course</Link>
                    </Button>
                  ) : (
                    <Button onClick={() => enrollCourse(course.id)} disabled={locked} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
                      {currentUser ? 'Enroll' : 'Preview / enroll'}
                    </Button>
                  )}
                  {locked && (
                    <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
                      <Link to="/plans">Upgrade</Link>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}
