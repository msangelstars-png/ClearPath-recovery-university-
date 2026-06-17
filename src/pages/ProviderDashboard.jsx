import { useEffect, useState } from 'react';
import { Activity, Award, BookOpen, ChevronRight, TrendingUp, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell, StatTile } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { COURSES, SCHOOLS } from '@/data/platform';

const TABS = ['Overview', 'Clients', 'Progress', 'Reports'];

function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-brand-card">
      <div className="h-full rounded-full bg-brand-primary transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function ProviderDashboard() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('Overview');
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ clients: 0, active: 0, certificates: 0, avgProgress: 0 });
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientDetail, setClientDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Provider sees clients linked to their organization or referral
      const { data: providerData } = await supabase
        .from('provider_clients')
        .select('client_user_id, status, added_at')
        .eq('provider_user_id', currentUser.id)
        .order('added_at', { ascending: false });

      if (!providerData || providerData.length === 0) {
        setLoading(false);
        return;
      }

      const clientIds = providerData.map((r) => r.client_user_id);

      const [profilesRes, enrollRes, certRes] = await Promise.all([
        supabase.from('profiles').select('id,display_name,email,plan,onboarding_complete,created_at').in('id', clientIds),
        supabase.from('course_enrollments').select('user_id,course_id,progress,status').in('user_id', clientIds),
        supabase.from('certificates').select('user_id,course_id,issued_at').in('user_id', clientIds),
      ]);

      const profiles = profilesRes.data || [];
      const enrollments = enrollRes.data || [];
      const certs = certRes.data || [];

      const enriched = profiles.map((p) => {
        const myEnroll = enrollments.filter((e) => e.user_id === p.id);
        const myCerts = certs.filter((c) => c.user_id === p.id);
        const avgProg = myEnroll.length > 0 ? Math.round(myEnroll.reduce((s, e) => s + (e.progress || 0), 0) / myEnroll.length) : 0;
        const linked = providerData.find((r) => r.client_user_id === p.id);
        return { ...p, enrollments: myEnroll, certificates: myCerts, avgProgress: avgProg, clientStatus: linked?.status || 'active' };
      });

      const active = enriched.filter((c) => c.clientStatus === 'active').length;
      const totalCerts = certs.length;
      const avgProgress = enriched.length > 0 ? Math.round(enriched.reduce((s, c) => s + c.avgProgress, 0) / enriched.length) : 0;

      setClients(enriched);
      setStats({ clients: enriched.length, active, certificates: totalCerts, avgProgress });
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const loadClientDetail = async (client) => {
    setSelectedClient(client);
    const [checkinRes, journalRes] = await Promise.all([
      supabase.from('checkins').select('mood,energy,created_at').eq('user_id', client.id).order('created_at', { ascending: false }).limit(7),
      supabase.from('journal_entries').select('created_at').eq('user_id', client.id).order('created_at', { ascending: false }).limit(5),
    ]);
    setClientDetail({
      checkins: checkinRes.data || [],
      journalCount: journalRes.data?.length || 0,
    });
    setTab('Progress');
  };

  if (loading) {
    return (
      <PageShell eyebrow="Provider dashboard" title="Client management">
        <div className="flex items-center justify-center py-24 text-brand-muted">Loading dashboard...</div>
      </PageShell>
    );
  }

  return (
    <PageShell eyebrow="Provider dashboard" title="Client management">
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total clients" value={stats.clients} icon={Users} />
        <StatTile label="Active clients" value={stats.active} icon={UserCheck} />
        <StatTile label="Certificates earned" value={stats.certificates} icon={Award} />
        <StatTile label="Avg. course progress" value={`${stats.avgProgress}%`} icon={TrendingUp} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t !== 'Progress') setSelectedClient(null); }}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-brand-primary text-white' : 'bg-white border border-brand-border text-brand-charcoal hover:bg-brand-card'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2">
            <h2 className="mb-5 font-heading text-2xl text-brand-dark">Client activity summary</h2>
            {clients.length === 0 ? (
              <div className="rounded-xl bg-brand-card p-8 text-center">
                <Users className="mx-auto mb-3 text-brand-primary" size={36} />
                <p className="font-heading text-lg text-brand-dark">No clients linked yet</p>
                <p className="mt-2 text-sm text-brand-muted">
                  Clients are linked to your provider account when they enroll through your referral or your organization manages their access.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.slice(0, 5).map((client) => (
                  <button
                    key={client.id}
                    onClick={() => loadClientDetail(client)}
                    className="flex w-full items-center gap-4 rounded-xl bg-brand-card p-4 text-left hover:bg-brand-card/80 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white font-heading font-semibold">
                      {(client.display_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-brand-dark truncate">{client.display_name || 'Unknown'}</p>
                      <div className="mt-1.5">
                        <ProgressBar value={client.avgProgress} />
                      </div>
                      <p className="mt-1 text-xs text-brand-muted">
                        {client.enrollments.length} courses · {client.certificates.length} certificates · {client.avgProgress}% avg
                      </p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-brand-muted" />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-5">
            <div className="rounded-2xl border border-brand-border bg-white p-6">
              <h2 className="mb-4 font-heading text-xl text-brand-dark">Platform breakdown</h2>
              <div className="space-y-3">
                {SCHOOLS.slice(0, 5).map((school) => {
                  const schoolEnrollments = clients.flatMap((c) => c.enrollments).filter((e) => {
                    const course = COURSES.find((c) => c.id === e.course_id);
                    return course?.school_id === school.id;
                  });
                  return (
                    <div key={school.id}>
                      <div className="flex justify-between text-sm">
                        <span className="truncate text-brand-charcoal">{school.name.replace('School of ', '')}</span>
                        <span className="text-brand-muted">{schoolEnrollments.length}</span>
                      </div>
                      <ProgressBar value={stats.clients > 0 ? (schoolEnrollments.length / (stats.clients || 1)) * 100 : 0} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-white p-6">
              <h2 className="mb-3 font-heading text-xl text-brand-dark">Quick actions</h2>
              <div className="space-y-2">
                <Button asChild variant="outline" className="w-full justify-start rounded-xl border-brand-border text-sm">
                  <a href="mailto:support@clearpath.university">
                    <BookOpen size={15} /> Request curriculum report
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start rounded-xl border-brand-border text-sm">
                  <a href="mailto:support@clearpath.university">
                    <Activity size={15} /> Export client progress
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === 'Clients' && (
        <section className="rounded-2xl border border-brand-border bg-white p-6">
          <h2 className="mb-5 font-heading text-2xl text-brand-dark">All clients</h2>
          {clients.length === 0 ? (
            <p className="text-brand-muted">No clients linked to your provider account.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-left">
                    <th className="pb-3 font-medium text-brand-muted">Client</th>
                    <th className="pb-3 font-medium text-brand-muted">Status</th>
                    <th className="pb-3 font-medium text-brand-muted">Courses</th>
                    <th className="pb-3 font-medium text-brand-muted">Certs</th>
                    <th className="pb-3 font-medium text-brand-muted">Avg progress</th>
                    <th className="pb-3 font-medium text-brand-muted">Onboarded</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-brand-border/50 last:border-0">
                      <td className="py-3">
                        <p className="font-medium text-brand-dark">{client.display_name || 'Unknown'}</p>
                        <p className="text-xs text-brand-muted">{client.email}</p>
                      </td>
                      <td className="py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${client.clientStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                          {client.clientStatus}
                        </span>
                      </td>
                      <td className="py-3 text-brand-charcoal">{client.enrollments.length}</td>
                      <td className="py-3 text-brand-charcoal">{client.certificates.length}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20">
                            <ProgressBar value={client.avgProgress} />
                          </div>
                          <span className="text-brand-charcoal">{client.avgProgress}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-brand-muted">{client.onboarding_complete ? 'Yes' : 'No'}</td>
                      <td className="py-3">
                        <button
                          onClick={() => loadClientDetail(client)}
                          className="rounded-full px-3 py-1 text-xs font-medium text-brand-primary hover:bg-brand-card"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'Progress' && (
        <div>
          {!selectedClient ? (
            <div className="rounded-2xl border border-dashed border-brand-border bg-white p-12 text-center">
              <TrendingUp className="mx-auto mb-4 text-brand-primary" size={40} />
              <p className="font-heading text-xl text-brand-dark">Select a client to view their progress</p>
              <p className="mt-2 text-brand-muted">Go to the Clients tab and click View next to any client.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-2xl border border-brand-border bg-white p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white font-heading text-xl font-semibold">
                  {(selectedClient.display_name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-heading text-2xl text-brand-dark">{selectedClient.display_name}</h2>
                  <p className="text-sm text-brand-muted">{selectedClient.email}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <StatTile label="Enrolled courses" value={selectedClient.enrollments.length} icon={BookOpen} />
                <StatTile label="Certificates" value={selectedClient.certificates.length} icon={Award} />
                <StatTile label="Avg progress" value={`${selectedClient.avgProgress}%`} icon={TrendingUp} />
              </div>

              <section className="rounded-2xl border border-brand-border bg-white p-6">
                <h3 className="mb-5 font-heading text-xl text-brand-dark">Course enrollments</h3>
                {selectedClient.enrollments.length === 0 ? (
                  <p className="text-brand-muted">No courses enrolled yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedClient.enrollments.map((enroll) => {
                      const course = COURSES.find((c) => c.id === enroll.course_id);
                      return (
                        <div key={enroll.course_id} className="rounded-xl bg-brand-card p-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-brand-dark">{course?.title || enroll.course_id}</p>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${enroll.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {enroll.status || 'in progress'}
                            </span>
                          </div>
                          <div className="mt-2">
                            <ProgressBar value={enroll.progress || 0} />
                          </div>
                          <p className="mt-1 text-xs text-brand-muted">{enroll.progress || 0}% complete</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {clientDetail && (
                <section className="rounded-2xl border border-brand-border bg-white p-6">
                  <h3 className="mb-5 font-heading text-xl text-brand-dark">Recent check-ins</h3>
                  {clientDetail.checkins.length === 0 ? (
                    <p className="text-brand-muted">No check-ins recorded yet.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {clientDetail.checkins.map((c, i) => (
                        <div key={i} className="rounded-xl bg-brand-card p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-brand-dark">Mood: {c.mood}/10</p>
                              <p className="text-sm text-brand-charcoal">Energy: {c.energy}/10</p>
                            </div>
                            <p className="text-xs text-brand-muted">{new Date(c.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-4 text-sm text-brand-muted">Journal entries (last 5): {clientDetail.journalCount}</p>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'Reports' && (
        <section className="rounded-2xl border border-brand-border bg-white p-8">
          <h2 className="mb-3 font-heading text-2xl text-brand-dark">Progress reports</h2>
          <p className="text-brand-charcoal">
            Downloadable client progress reports are available upon request. Contact ClearPath support to receive a comprehensive PDF report for individual clients or your full caseload.
          </p>
          <div className="mt-6 rounded-xl bg-brand-card p-5">
            <p className="font-medium text-brand-dark">Request a report</p>
            <p className="mt-1 text-sm text-brand-charcoal">
              Email <span className="text-brand-primary">providers@clearpath.university</span> with your provider ID and the client(s) you need reports for.
            </p>
            <p className="mt-1 text-sm text-brand-muted">Reports are generated within 1–2 business days.</p>
          </div>
        </section>
      )}
    </PageShell>
  );
}
