import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Award, Bell, BookOpen, CalendarDays, FileArchive, Flame, GraduationCap, LineChart, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageShell, StatTile, EmptyState } from "@/components/Layout";
import { platformApi } from "@/services/api";
import UserAvatar from "@/components/UserAvatar";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [error, setError] = useState("");
  const [params] = useSearchParams();

  useEffect(() => { platformApi.dashboard().then(({ data }) => setData(data)).catch(() => setError("Dashboard data could not load. Please refresh and try again.")); }, []);
  useEffect(() => {
    if (!data?.is_first_session) return;
    const timer = setTimeout(() => platformApi.markDashboardVisited().catch(() => {}), 1200);
    return () => clearTimeout(timer);
  }, [data?.is_first_session]);
  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) return;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      try {
        const { data: status } = await platformApi.paymentStatus(sessionId);
        if (status.payment_status === "paid") {
          setPaymentMessage("Premium is active. Full courses and certificates are unlocked.");
          const fresh = await platformApi.dashboard();
          setData(fresh.data);
        } else if (attempts < 5) setTimeout(poll, 2000);
        else setPaymentMessage("Payment is still processing. Refresh this dashboard shortly.");
      } catch {
        setPaymentMessage("Payment status could not be confirmed yet. Please refresh shortly.");
      }
    };
    poll();
  }, [params]);

  if (error) return <PageShell title="Dashboard"><div className="rounded-2xl border border-brand-border bg-white p-6 text-brand-error" data-testid="dashboard-error-state">{error}</div></PageShell>;
  if (!data) return <PageShell title="Dashboard"><div data-testid="dashboard-loading-state">Preparing your dashboard…</div></PageShell>;
  const firstVisit = data.first_visit_experience || {};
  const welcomeTitle = firstVisit.welcome_message || (data.is_first_session ? `Welcome to ClearPath, ${data.user.name}` : `Welcome back, ${data.user.name}`);

  return (
    <PageShell eyebrow={data.is_first_session ? "Your first day at ClearPath" : "Student dashboard"} title={welcomeTitle} action={<Button asChild data-testid="dashboard-ai-action" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><Link to="/ai-professors"><Sparkles size={16} /> Ask a professor</Link></Button>}>
      {paymentMessage && <div className="mb-6 rounded-2xl border border-brand-success/30 bg-green-50 p-4 text-brand-success" data-testid="payment-status-message">{paymentMessage}</div>}
      {data.trial?.active && <div className="mb-6 rounded-2xl border border-brand-primary/30 bg-brand-card p-5" data-testid="premium-trial-banner"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">7-day Premium trial active</p><h2 className="mt-2 font-heading text-2xl text-brand-dark" data-testid="premium-trial-days">{data.trial.days_remaining} days remaining</h2><p className="mt-1 text-sm text-brand-muted">Full access is unlocked during your trial — schools, AI professors, courses, events, assignments, certificates, journals, and premium features.</p></div>}
      <section className="mb-6 flex flex-col gap-4 rounded-2xl border border-brand-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between" data-testid="dashboard-profile-strip"><div className="flex items-center gap-4"><UserAvatar user={data.user} size="lg" testId="dashboard-user-avatar" /><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Student profile</p><h2 className="font-heading text-2xl text-brand-dark" data-testid="dashboard-profile-name">{data.user.display_name || data.user.name}</h2><p className="text-sm text-brand-muted" data-testid="dashboard-profile-visibility">{data.user.profile_visibility} profile · {data.user.language_preference}</p></div></div><Button asChild variant="outline" data-testid="dashboard-edit-profile-button" className="rounded-full border-brand-border bg-white"><Link to="/profile">Edit profile</Link></Button></section>
      {data.is_first_session && (
        <section className="mb-6 rounded-2xl border border-brand-border bg-white p-6" data-testid="first-visit-welcome-panel">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid="first-visit-label">Your university orientation</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-brand-dark" data-testid="first-visit-title">Your personalized roadmap is ready</h2>
          <p className="mt-2 text-brand-muted" data-testid="first-visit-intro-copy">Your 7-day Premium trial is active with no credit card required. Use this first week to meet your professor, start your course, and explore the university.</p>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className="rounded-xl bg-brand-card p-4" data-testid="first-visit-roadmap-summary">
              <h3 className="font-heading text-xl text-brand-dark">Roadmap summary</h3>
              <div className="mt-3 space-y-2">{(firstVisit.roadmap_summary || []).map((week) => <p key={week.week} className="text-sm text-brand-charcoal" data-testid={`first-visit-roadmap-week-${week.week}`}>Week {week.week}: {week.title}</p>)}</div>
            </div>
            <div className="rounded-xl bg-brand-card p-4" data-testid="first-visit-recommended-course">
              <h3 className="font-heading text-xl text-brand-dark">Recommended first course</h3>
              <p className="mt-2 text-sm text-brand-charcoal" data-testid="first-visit-course-title">{firstVisit.recommended_first_course?.title || "Recovery Foundations"}</p>
              <p className="mt-1 text-xs text-brand-muted" data-testid="first-visit-course-summary">{firstVisit.recommended_first_course?.summary || "Start with a gentle foundation course."}</p>
            </div>
            <div className="rounded-xl bg-brand-card p-4" data-testid="first-visit-assigned-professor">
              <h3 className="font-heading text-xl text-brand-dark">Assigned AI Professor</h3>
              <p className="mt-2 text-sm text-brand-charcoal" data-testid="first-visit-professor-name">{firstVisit.assigned_ai_professor?.avatar} {firstVisit.assigned_ai_professor?.name || "Professor Hope"}</p>
              <p className="mt-1 text-xs text-brand-muted" data-testid="first-visit-professor-style">{firstVisit.assigned_ai_professor?.teaching_style || "Warm, practical guidance."}</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl border border-brand-border p-4" data-testid="first-visit-next-steps">
            <h3 className="font-heading text-xl text-brand-dark">Next steps</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-4">{(firstVisit.next_steps || []).map((step) => <div key={step} className="flex items-center gap-2 text-sm text-brand-charcoal" data-testid={`first-visit-step-${step.toLowerCase().replaceAll(" ", "-")}`}><ArrowRight size={14} className="text-brand-primary" /> {step}</div>)}</div>
          </div>
          <div className="mt-5 rounded-xl border border-brand-border p-4" data-testid="first-visit-focus-personalization">
            <h3 className="font-heading text-xl text-brand-dark">Focus-specific personalization</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">{(firstVisit.focus_recommendations || []).map((item) => <article key={item.focus} className="rounded-lg bg-brand-card p-4" data-testid={`first-visit-focus-${item.focus.toLowerCase().replaceAll("/", "-").replaceAll(" ", "-")}`}><p className="font-medium text-brand-dark">{item.focus}</p><p className="mt-2 text-sm text-brand-charcoal">{item.resource}</p><p className="mt-2 text-xs text-brand-muted">Community: {item.community}</p></article>)}</div>
          </div>
        </section>
      )}
      <div className="grid gap-6 md:grid-cols-4" data-testid="dashboard-stat-grid">
        <StatTile label="Progress" value={`${data.progress}%`} icon={LineChart} />
        <StatTile label="Streak" value={`${data.streak} days`} icon={Flame} />
        <StatTile label="Certificates" value={data.certificates.length} icon={Award} />
        <StatTile label="Plan" value={data.user.subscription_status} icon={Target} />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5" data-testid="dashboard-bento-grid">
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-3" data-testid="current-learning-path-card">
          <h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="current-learning-path-title">Current learning path</h2>
          {data.active_learning.length === 0 ? <EmptyState title="No active course yet" text="Enroll in a school course to begin tracking lessons, quizzes, and certificates." cta="Browse courses" to="/schools" /> : <div className="mt-5 space-y-4">{data.active_learning.map((item) => <article key={item.id} className="rounded-xl bg-brand-card p-4" data-testid={`active-course-${item.course_id}`}><div className="flex items-center justify-between gap-4"><div><h3 className="font-heading text-xl text-brand-dark" data-testid={`active-course-title-${item.course_id}`}>{item.course?.title}</h3><p className="text-sm text-brand-muted" data-testid={`active-course-professor-${item.course_id}`}>{item.course?.instructor_ai}</p></div><Button asChild variant="outline" data-testid={`continue-course-button-${item.course_id}`} className="rounded-full border-brand-border bg-white"><Link to={`/courses/${item.course_id}`}>Continue</Link></Button></div><Progress value={item.progress_percentage} className="mt-4 bg-white" data-testid={`active-course-progress-${item.course_id}`} /></article>)}</div>}
        </section>
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2" data-testid="ai-recommendations-card">
          <h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="ai-recommendations-title">AI recommendations</h2>
          <div className="mt-5 space-y-3">{data.recommendations.map((item) => <p key={item} className="rounded-xl bg-brand-card p-4 text-sm text-brand-charcoal" data-testid={`recommendation-${item.slice(0, 10).toLowerCase().replaceAll(" ", "-")}`}>{item}</p>)}</div>
        </section>
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2" data-testid="goals-card">
          <h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="goals-card-title">Goals</h2>
          <div className="mt-4 flex flex-wrap gap-2">{(data.profile?.goals || ["Complete onboarding"]).map((goal) => <span key={goal} className="rounded-full bg-brand-card px-3 py-2 text-sm text-brand-charcoal" data-testid={`goal-chip-${goal.toLowerCase().replaceAll(" ", "-")}`}>{goal}</span>)}</div>
        </section>
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-3" data-testid="notifications-card">
          <div className="flex items-center gap-2"><Bell className="text-brand-primary" size={20} /><h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="notifications-title">Notifications</h2></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">{data.notifications.map((note) => <div key={note} className="rounded-xl border border-brand-border p-4 text-sm text-brand-muted" data-testid={`notification-${note.toLowerCase().replaceAll(" ", "-")}`}>{note}</div>)}</div>
        </section>
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-5" data-testid="phase-two-quicklinks-card">
          <h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="phase-two-quicklinks-title">University campus</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <Button asChild variant="outline" data-testid="dashboard-programs-link" className="rounded-full border-brand-border bg-white"><Link to="/programs"><GraduationCap size={16} /> Programs</Link></Button>
            <Button asChild variant="outline" data-testid="dashboard-events-link" className="rounded-full border-brand-border bg-white"><Link to="/events"><CalendarDays size={16} /> Events</Link></Button>
            <Button asChild variant="outline" data-testid="dashboard-replays-link" className="rounded-full border-brand-border bg-white"><Link to="/replays"><BookOpen size={16} /> Replays</Link></Button>
            <Button asChild variant="outline" data-testid="dashboard-documents-link" className="rounded-full border-brand-border bg-white"><Link to="/documents"><FileArchive size={16} /> Documents</Link></Button>
            <Button asChild variant="outline" data-testid="dashboard-voice-studio-link" className="rounded-full border-brand-border bg-white"><Link to="/voice-studio"><Sparkles size={16} /> Voice Studio</Link></Button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}