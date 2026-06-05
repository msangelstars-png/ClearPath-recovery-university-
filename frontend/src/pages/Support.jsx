import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Support() {
  const [support, setSupport] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { platformApi.support().then(({ data }) => setSupport(data)).catch(() => setError("Support information could not load.")); }, []);
  return (
    <PageShell eyebrow="Support center" title="Help for students and families">
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error" data-testid="support-error-message">{error}</div>}
      <section className="rounded-2xl border border-brand-border bg-white p-8" data-testid="support-center-card">
        <LifeBuoy className="mb-4 text-brand-primary" size={34} />
        <p className="max-w-3xl text-brand-charcoal" data-testid="support-intro">Find help for account access, course progress, AI professor use, subscriptions, certificates, and family support learning.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3" data-testid="support-topic-grid">{(support?.topics || []).map((topic) => <div key={topic} className="rounded-xl bg-brand-card p-4" data-testid={`support-topic-${topic.toLowerCase().replaceAll(" ", "-")}`}><HelpCircle className="mb-2 text-brand-primary" size={18} />{topic}</div>)}</div>
        <div className="mt-6 rounded-xl border border-brand-border p-4" data-testid="support-contact-box"><p className="font-medium text-brand-dark" data-testid="support-contact-email">{support?.contact}</p><p className="mt-1 text-sm text-brand-charcoal" data-testid="support-contact-phone">{support?.phone}</p><p className="mt-2 text-sm text-brand-muted" data-testid="support-crisis-note">{support?.crisis_note}</p><div className="mt-4 flex flex-wrap gap-3"><Button asChild data-testid="support-create-ticket-link" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><Link to="/tickets">Create support ticket</Link></Button><Button asChild variant="outline" data-testid="support-contact-center-link" className="rounded-full border-brand-border bg-white"><Link to="/contact-center">Contact center</Link></Button></div></div>
      </section>
    </PageShell>
  );
}