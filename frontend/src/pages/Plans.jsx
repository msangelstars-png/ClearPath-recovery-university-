import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState("");
  useEffect(() => { platformApi.plans().then(({ data }) => setPlans(data.plans)); }, []);
  const choose = async (plan) => {
    setLoading(plan.id);
    const { data } = await platformApi.checkout({ plan_id: plan.id, origin_url: window.location.origin });
    window.location.href = data.url;
  };
  return (
    <PageShell eyebrow="Subscriptions" title="Choose your access level">
      <div className="grid gap-6 md:grid-cols-2" data-testid="plans-grid">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-2xl border border-brand-border bg-white p-8" data-testid={`plan-card-${plan.id}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid={`plan-name-${plan.id}`}>{plan.name}</p>
            <h2 className="mt-4 font-heading text-5xl font-semibold text-brand-dark" data-testid={`plan-price-${plan.id}`}>{plan.amount === 0 ? "Free" : `$${plan.amount}`}<span className="text-base font-normal text-brand-muted">{plan.amount > 0 ? "/month" : ""}</span></h2>
            <div className="mt-6 space-y-3">{plan.features.map((feature) => <div key={feature} className="flex items-center gap-3 text-brand-charcoal" data-testid={`plan-feature-${plan.id}-${feature.toLowerCase().replaceAll(" ", "-")}`}><CheckCircle2 size={18} className="text-brand-success" /> {feature}</div>)}</div>
            <Button onClick={() => choose(plan)} disabled={loading === plan.id} data-testid={`choose-plan-button-${plan.id}`} className="mt-8 w-full rounded-full bg-brand-primary py-6 text-white hover:bg-brand-primaryHover"><CreditCard size={17} /> {loading === plan.id ? "Opening…" : plan.id === "free" ? "Start free" : "Upgrade with Stripe"}</Button>
          </article>
        ))}
      </div>
    </PageShell>
  );
}