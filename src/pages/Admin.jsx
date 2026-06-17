import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, BookOpen, GraduationCap, LifeBuoy, MessageSquare, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell, StatTile } from '@/components/Layout';
import { supabase } from '@/lib/supabase';

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
