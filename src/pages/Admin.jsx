import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BookOpen, Download, GraduationCap, Loader as Loader2, LifeBuoy, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell, StatTile } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { toCSV, downloadCSV } from '@/lib/csv';

const EXPORTS = [
  {
    id: 'users',
    label: 'Users',
    description: 'All student accounts — name, email, role, plan, onboarding status, join date',
    filename: 'clearpath-users.csv',
    fetch: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,display_name,email,role,plan,trial_ends_at,onboarding_complete,language,created_at')
        .order('created_at', { ascending: false });
      return data || [];
    },
    columns: [
      { label: 'ID', key: 'id' },
      { label: 'Name', key: 'display_name' },
      { label: 'Email', key: 'email' },
      { label: 'Role', key: 'role' },
      { label: 'Plan', key: 'plan' },
      { label: 'Trial Ends', value: (r) => r.trial_ends_at ? new Date(r.trial_ends_at).toLocaleDateString() : '' },
      { label: 'Onboarded', value: (r) => r.onboarding_complete ? 'Yes' : 'No' },
      { label: 'Language', key: 'language' },
      { label: 'Joined', value: (r) => new Date(r.created_at).toLocaleDateString() },
    ],
  },
  {
    id: 'enrollments',
    label: 'Course Enrollments',
    description: 'All course enrollments with student info, progress %, and completion status',
    filename: 'clearpath-enrollments.csv',
    fetch: async () => {
      const { data } = await supabase
        .from('course_enrollments')
        .select('id,user_id,course_id,progress,status,enrolled_at,completed_at,profiles(display_name,email)')
        .order('enrolled_at', { ascending: false });
      return data || [];
    },
    columns: [
      { label: 'Enrollment ID', key: 'id' },
      { label: 'Student Name', value: (r) => r.profiles?.display_name || '' },
      { label: 'Student Email', value: (r) => r.profiles?.email || '' },
      { label: 'Course ID', key: 'course_id' },
      { label: 'Progress %', key: 'progress' },
      { label: 'Status', key: 'status' },
      { label: 'Enrolled At', value: (r) => new Date(r.enrolled_at).toLocaleDateString() },
      { label: 'Completed At', value: (r) => r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '' },
    ],
  },
  {
    id: 'certificates',
    label: 'Certificates',
    description: 'All certificates issued with student info and course details',
    filename: 'clearpath-certificates.csv',
    fetch: async () => {
      const { data } = await supabase
        .from('certificates')
        .select('id,user_id,course_id,course_title,issued_at,profiles(display_name,email)')
        .order('issued_at', { ascending: false });
      return data || [];
    },
    columns: [
      { label: 'Certificate ID', key: 'id' },
      { label: 'Student Name', value: (r) => r.profiles?.display_name || '' },
      { label: 'Student Email', value: (r) => r.profiles?.email || '' },
      { label: 'Course ID', key: 'course_id' },
      { label: 'Course Title', key: 'course_title' },
      { label: 'Issued At', value: (r) => new Date(r.issued_at).toLocaleDateString() },
    ],
  },
  {
    id: 'tickets',
    label: 'Support Tickets',
    description: 'All support tickets with student info, category, status, and resolution date',
    filename: 'clearpath-support-tickets.csv',
    fetch: async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('id,user_id,subject,category,status,response,resolved_at,created_at,profiles(display_name,email)')
        .order('created_at', { ascending: false });
      return data || [];
    },
    columns: [
      { label: 'Ticket ID', key: 'id' },
      { label: 'Student Name', value: (r) => r.profiles?.display_name || '' },
      { label: 'Student Email', value: (r) => r.profiles?.email || '' },
      { label: 'Subject', key: 'subject' },
      { label: 'Category', key: 'category' },
      { label: 'Status', key: 'status' },
      { label: 'Has Response', value: (r) => r.response ? 'Yes' : 'No' },
      { label: 'Resolved At', value: (r) => r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : '' },
      { label: 'Created At', value: (r) => new Date(r.created_at).toLocaleDateString() },
    ],
  },
  {
    id: 'checkins',
    label: 'Daily Check-ins',
    description: 'All check-in records with mood, energy, and sobriety data (anonymized by student ID)',
    filename: 'clearpath-checkins.csv',
    fetch: async () => {
      const { data } = await supabase
        .from('checkins')
        .select('id,user_id,mood,energy,sober,created_at,profiles(display_name,email)')
        .order('created_at', { ascending: false });
      return data || [];
    },
    columns: [
      { label: 'Check-in ID', key: 'id' },
      { label: 'Student Name', value: (r) => r.profiles?.display_name || '' },
      { label: 'Student Email', value: (r) => r.profiles?.email || '' },
      { label: 'Mood (1-10)', key: 'mood' },
      { label: 'Energy (1-10)', key: 'energy' },
      { label: 'Sober', value: (r) => r.sober ? 'Yes' : 'No' },
      { label: 'Date', value: (r) => new Date(r.created_at).toLocaleDateString() },
    ],
  },
];

function ExportCard({ config }) {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await config.fetch();
      setCount(rows.length);
      if (!rows.length) { setError('No data to export.'); return; }
      const csv = toCSV(rows, config.columns);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCSV(csv, config.filename.replace('.csv', `-${stamp}.csv`));
    } catch {
      setError('Export failed. Check your admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-brand-border bg-white p-5">
      <div className="min-w-0">
        <p className="font-heading text-lg font-medium text-brand-dark">{config.label}</p>
        <p className="mt-1 text-sm text-brand-muted">{config.description}</p>
        {error && <p className="mt-2 text-xs text-brand-error">{error}</p>}
        {count !== null && !error && (
          <p className="mt-2 text-xs text-brand-success">{count} rows exported</p>
        )}
      </div>
      <Button
        onClick={run}
        disabled={loading}
        className="shrink-0 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {loading ? 'Exporting…' : 'Export CSV'}
      </Button>
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState({ users: 0, enrollments: 0, certificates: 0, tickets: 0, messages: 0, checkins: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [usersRes, enrollRes, certRes, ticketRes, msgRes, checkinRes, recentRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('course_enrollments').select('id', { count: 'exact', head: true }),
        supabase.from('certificates').select('id', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }),
        supabase.from('ai_messages').select('id', { count: 'exact', head: true }),
        supabase.from('checkins').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id,display_name,email,role,plan,created_at,onboarding_complete').order('created_at', { ascending: false }).limit(10),
      ]);
      setStats({
        users: usersRes.count ?? 0,
        enrollments: enrollRes.count ?? 0,
        certificates: certRes.count ?? 0,
        tickets: ticketRes.count ?? 0,
        messages: msgRes.count ?? 0,
        checkins: checkinRes.count ?? 0,
      });
      setRecentUsers(recentRes.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <PageShell eyebrow="Admin" title="Platform analytics">
        <div className="flex items-center justify-center py-24 text-brand-muted">Loading analytics...</div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Admin" title="Platform analytics">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Total users" value={stats.users} icon={Users} />
        <StatTile label="Course enrollments" value={stats.enrollments} icon={BookOpen} />
        <StatTile label="Certificates issued" value={stats.certificates} icon={GraduationCap} />
        <StatTile label="Support tickets" value={stats.tickets} icon={LifeBuoy} />
        <StatTile label="AI messages" value={stats.messages} icon={MessageSquare} />
        <StatTile label="Daily check-ins" value={stats.checkins} icon={Activity} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
          <Link to="/admin/support">Support ticket queue</Link>
        </Button>
      </div>

      <section className="mt-8 rounded-2xl border border-brand-border bg-white p-6">
        <div className="mb-5 flex items-center gap-3">
          <Download className="text-brand-primary" size={22} />
          <h2 className="font-heading text-2xl text-brand-dark">CSV Exports</h2>
        </div>
        <p className="mb-5 text-sm text-brand-muted">
          Download platform data as CSV files. Each export includes all records you have admin access to, stamped with today's date.
        </p>
        <div className="space-y-3">
          {EXPORTS.map((config) => (
            <ExportCard key={config.id} config={config} />
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-brand-border bg-white p-6">
        <h2 className="mb-5 font-heading text-2xl text-brand-dark">Recent users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-left">
                <th className="pb-3 font-medium text-brand-muted">User</th>
                <th className="pb-3 font-medium text-brand-muted">Role</th>
                <th className="pb-3 font-medium text-brand-muted">Plan</th>
                <th className="pb-3 font-medium text-brand-muted">Onboarded</th>
                <th className="pb-3 font-medium text-brand-muted">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id} className="border-b border-brand-border/50 last:border-0">
                  <td className="py-3">
                    <p className="font-medium text-brand-dark">{u.display_name || 'Unknown'}</p>
                    <p className="text-xs text-brand-muted">{u.email}</p>
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'provider' ? 'bg-blue-100 text-blue-700' : 'bg-brand-card text-brand-charcoal'}`}>
                      {u.role || 'student'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.plan === 'premium' || u.plan === 'premium_annual' ? 'bg-amber-100 text-amber-700' : 'bg-brand-card text-brand-charcoal'}`}>
                      {u.plan || 'free'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`text-xs ${u.onboarding_complete ? 'text-brand-success' : 'text-brand-muted'}`}>
                      {u.onboarding_complete ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 text-brand-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-brand-muted">No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
