import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Award, Bell, BookOpen, CalendarDays, FileArchive, Flame, GraduationCap, LineChart, Sparkles, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageShell, StatTile, EmptyState } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [error, setError] = useState("");
  const [params] = useSearchParams();

  useEffect(() => { platformApi.dashboard().then(({ data }) => setData(data)).catch(() => setError("Dashboard data could not load. Please refresh and try again.")); }, []);
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

  return (
    <PageShell eyebrow="Student dashboard" title={`Welcome back, ${data.user.name}`} action={<Button asChild data-testid="dashboard-ai-action" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><Link to="/ai-professors"><Sparkles size={16} /> Ask a professor</Link></Button>}>
      {paymentMessage && <div className="mb-6 rounded-2xl border border-brand-success/30 bg-green-50 p-4 text-brand-success" data-testid="payment-status-message">{paymentMessage}</div>}
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