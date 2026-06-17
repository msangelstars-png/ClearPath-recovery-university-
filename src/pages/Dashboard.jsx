import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, Bell, BookOpen, CalendarDays, FileArchive, Flame, GraduationCap, LineChart, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PageShell, StatTile, EmptyState } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    Promise.all([
      supabase.from('course_enrollments').select('*').eq('user_id', currentUser.id),
      supabase.from('certificates').select('*').eq('user_id', currentUser.id),
      supabase.from('checkins').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(7),
      supabase.from('onboarding_data').select('*').eq('user_id', currentUser.id).maybeSingle(),
    ]).then(([e, c, ch, o]) => {
      setEnrollments(e.data || []);
      setCertificates(c.data || []);
      setCheckins(ch.data || []);
      setOnboarding(o.data);
      setLoading(false);
    });
  }, [currentUser]);

  const streak = checkins.length;
  const avgProgress = enrollments.length
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  const trialActive = currentUser?.trial_ends_at && new Date(currentUser.trial_ends_at) > new Date();
  const trialDaysLeft = trialActive
    ? Math.ceil((new Date(currentUser.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const goals = onboarding?.goals || [];
  const roadmap = onboarding?.roadmap || [];

  const recommendations = [
    'Complete your first lesson to start building momentum.',
    'Check in daily to build your recovery streak.',
    'Ask an AI professor a question about your current focus area.',
    enrollments.length === 0 ? 'Enroll in a course to get started.' : `Continue "${enrollments[0]?.course_id?.replaceAll('-', ' ')}" — you're making progress.`,
  ].filter(Boolean).slice(0, 3);

  if (loading) {
    return (
      <PageShell title="Dashboard">
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-brand-card" />)}
        </div>
      </PageShell>
    );
  }

  const isFirstSession = checkins.length === 0 && enrollments.length === 0;

  return (
    <PageShell
      eyebrow={isFirstSession ? 'Your first day at ClearPath' : 'Student dashboard'}
      title={isFirstSession ? `Welcome to ClearPath, ${currentUser.display_name}` : `Welcome back, ${currentUser.display_name}`}
      action={
        <Button asChild className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
          <Link to="/ai-professors"><Sparkles size={16} /> Ask a professor</Link>
        </Button>
      }
    >
      {trialActive && (
        <div className="mb-6 rounded-2xl border border-brand-primary/30 bg-brand-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">7-day Premium trial active</p>
          <h2 className="mt-2 font-heading text-2xl text-brand-dark">{trialDaysLeft} days remaining</h2>
          <p className="mt-1 text-sm text-brand-muted">Full access is unlocked during your trial — schools, AI professors, courses, events, assignments, certificates, journals, and premium features.</p>
        </div>
      )}

      <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-brand-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar user={currentUser} size="lg" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Student profile</p>
            <h2 className="font-heading text-2xl text-brand-dark">{currentUser.display_name}</h2>
            <p className="text-sm text-brand-muted">{currentUser.plan} plan · {currentUser.language || 'en'}</p>
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
          <Link to="/profile">Edit profile</Link>
        </Button>
      </section>

      {isFirstSession && (
        <section className="mb-6 rounded-2xl border border-brand-border bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Your university orientation</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-brand-dark">Your personalized roadmap is ready</h2>
          <p className="mt-2 text-brand-muted">Your 7-day Premium trial is active with no credit card required. Use this first week to meet your professor, start your course, and explore the university.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl bg-brand-card p-4">
              <h3 className="font-heading text-xl text-brand-dark">First steps</h3>
              <div className="mt-3 space-y-2">
                {['Complete your roadmap', 'Enroll in a course', 'Ask a professor a question', 'Log your first check-in'].map((step) => (
                  <div key={step} className="flex items-center gap-2 text-sm text-brand-charcoal">
                    <ArrowRight size={14} className="text-brand-primary" /> {step}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-brand-card p-4">
              <h3 className="font-heading text-xl text-brand-dark">Recommended course</h3>
              <p className="mt-2 text-sm text-brand-charcoal">Recovery Foundations</p>
              <p className="mt-1 text-xs text-brand-muted">Start with a grounded foundation covering cravings, structure, and support systems.</p>
              <Button asChild className="mt-3 rounded-full bg-brand-primary text-xs text-white hover:bg-brand-primaryHover">
                <Link to="/schools">Browse courses</Link>
              </Button>
            </div>
            <div className="rounded-xl bg-brand-card p-4">
              <h3 className="font-heading text-xl text-brand-dark">Your AI Professor</h3>
              <p className="mt-2 text-sm text-brand-charcoal">🌱 Professor Hope</p>
              <p className="mt-1 text-xs text-brand-muted">Warm encouragement · evidence-based recovery · daily action steps.</p>
              <Button asChild className="mt-3 rounded-full bg-brand-primary text-xs text-white hover:bg-brand-primaryHover">
                <Link to="/ai-professors">Say hello</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-4">
        <StatTile label="Progress" value={`${avgProgress}%`} icon={LineChart} />
        <StatTile label="Streak" value={`${streak} days`} icon={Flame} />
        <StatTile label="Certificates" value={certificates.length} icon={Award} />
        <StatTile label="Plan" value={currentUser.plan || 'free'} icon={Target} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-3">
          <h2 className="font-heading text-2xl font-medium text-brand-dark">Current learning path</h2>
          {enrollments.length === 0 ? (
            <EmptyState
              title="No active course yet"
              text="Enroll in a school course to begin tracking lessons, quizzes, and certificates."
              cta="Browse courses"
              to="/schools"
            />
          ) : (
            <div className="mt-5 space-y-4">
              {enrollments.map((item) => (
                <article key={item.id} className="rounded-xl bg-brand-card p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-heading text-xl text-brand-dark">{item.course_id.replaceAll('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</h3>
                      <p className="text-sm text-brand-muted">{item.progress || 0}% complete · {item.completed_lessons?.length || 0} lessons done</p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
                      <Link to={`/courses/${item.course_id}`}>Continue</Link>
                    </Button>
                  </div>
                  <Progress value={item.progress || 0} className="mt-4 bg-white" />
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2">
          <h2 className="font-heading text-2xl font-medium text-brand-dark">AI recommendations</h2>
          <div className="mt-5 space-y-3">
            {recommendations.map((item) => (
              <p key={item} className="rounded-xl bg-brand-card p-4 text-sm text-brand-charcoal">{item}</p>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2">
          <h2 className="font-heading text-2xl font-medium text-brand-dark">Goals</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(goals.length > 0 ? goals : ['Complete onboarding', 'Start first course']).map((goal) => (
              <span key={goal} className="rounded-full bg-brand-card px-3 py-2 text-sm text-brand-charcoal">{goal}</span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-3">
          <div className="flex items-center gap-2">
            <Bell className="text-brand-primary" size={20} />
            <h2 className="font-heading text-2xl font-medium text-brand-dark">Notifications</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              checkin => checkin ? `Mood check-in streak: ${streak} days` : 'Log your first daily check-in',
              () => certificates.length > 0 ? `${certificates.length} certificate${certificates.length > 1 ? 's' : ''} earned` : 'Complete a course to earn a certificate',
              () => enrollments.length > 0 ? `${enrollments.length} active course${enrollments.length > 1 ? 's' : ''}` : 'Enroll in your first course',
            ].map((fn, i) => (
              <div key={i} className="rounded-xl border border-brand-border p-4 text-sm text-brand-muted">
                {i === 0 ? fn(checkins.length > 0) : fn()}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-5">
          <h2 className="font-heading text-2xl font-medium text-brand-dark">University campus</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
              <Link to="/programs"><GraduationCap size={16} /> Programs</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
              <Link to="/events"><CalendarDays size={16} /> Events</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
              <Link to="/replays"><BookOpen size={16} /> Replays</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
              <Link to="/documents"><FileArchive size={16} /> Documents</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
              <Link to="/voice-studio"><Sparkles size={16} /> Voice Studio</Link>
            </Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
