import { useEffect, useState } from "react";
import { BarChart3, CreditCard, GraduationCap, Users } from "lucide-react";
import { PageShell, StatTile } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Admin() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { platformApi.adminSummary().then(({ data }) => setSummary(data)).catch(() => setError("Admin analytics could not load.")); }, []);
  if (error) return <PageShell title="Admin"><div className="rounded-2xl border border-brand-border bg-white p-6 text-brand-error" data-testid="admin-error-state">{error}</div></PageShell>;
  if (!summary) return <PageShell title="Admin"><div data-testid="admin-loading-state">Loading admin panel…</div></PageShell>;
  return (
    <PageShell eyebrow="Admin panel" title="Users, courses, payments, and analytics">
      <div className="grid gap-6 md:grid-cols-4" data-testid="admin-stat-grid"><StatTile label="Users" value={summary.users} icon={Users} /><StatTile label="Courses" value={summary.courses} icon={GraduationCap} /><StatTile label="Enrollments" value={summary.enrollments} icon={BarChart3} /><StatTile label="Premium" value={summary.premium_students} icon={CreditCard} /></div>
      <section className="mt-8 rounded-2xl border border-brand-border bg-white p-6" data-testid="admin-payments-card"><h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="admin-payments-title">Recent payments</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm" data-testid="admin-payments-table"><thead><tr className="border-b border-brand-border text-brand-muted"><th className="py-3">Email</th><th>Plan</th><th>Status</th><th>Amount</th></tr></thead><tbody>{summary.recent_payments.map((payment) => <tr key={payment.id} className="border-b border-brand-border" data-testid={`admin-payment-row-${payment.id}`}><td className="py-3" data-testid={`admin-payment-email-${payment.id}`}>{payment.email}</td><td data-testid={`admin-payment-plan-${payment.id}`}>{payment.plan_id}</td><td data-testid={`admin-payment-status-${payment.id}`}>{payment.payment_status}</td><td data-testid={`admin-payment-amount-${payment.id}`}>${payment.amount}</td></tr>)}</tbody></table></div></section>
    </PageShell>
  );
}