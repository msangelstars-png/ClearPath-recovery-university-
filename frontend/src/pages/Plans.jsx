import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import EnrollmentPrompt from "@/components/EnrollmentPrompt";

export default function Plans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { platformApi.plans().then(({ data }) => setPlans(data.plans)).catch(() => setError("Subscription plans could not load.")); }, []);
  const choose = async (plan) => {
    if (!user) {
      setError("Create your free account to continue your personalized recovery journey.");
      return;
    }
    setLoading(plan.id);
    setError("");
    try {
      const { data } = await platformApi.checkout({ plan_id: plan.id, origin_url: window.location.origin });
      window.location.href = data.url;
    } catch (err) {
      setError(err.response?.data?.detail || "Checkout could not be opened. Please try again.");
      setLoading("");
    }
  };
  return (
    <PageShell eyebrow="Subscriptions" title="Choose your access level">
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error" data-testid="plans-error-message">{error}</div>}
      {!user && <div className="mb-6"><EnrollmentPrompt text="You can review pricing and features now. Create your free account when you’re ready to start your personalized plan." /></div>}
      <div className="grid gap-6 md:grid-cols-2" data-testid="plans-grid">
        {plans.map((plan) => (
          <article key={plan.id} className="rounded-2xl border border-brand-border bg-white p-8" data-testid={`plan-card-${plan.id}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid={`plan-name-${plan.id}`}>{plan.name}</p>
            <h2 className="mt-4 font-heading text-5xl font-semibold text-brand-dark" data-testid={`plan-price-${plan.id}`}>{plan.amount === 0 ? "Free" : `$${plan.amount}`}<span className="text-base font-normal text-brand-muted">{plan.id === "premium_annual" ? "/year" : plan.amount > 0 ? "/month" : ""}</span></h2>
            <div className="mt-6 space-y-3">{plan.features.map((feature) => <div key={feature} className="flex items-center gap-3 text-brand-charcoal" data-testid={`plan-feature-${plan.id}-${feature.toLowerCase().replaceAll(" ", "-")}`}><CheckCircle2 size={18} className="text-brand-success" /> {feature}</div>)}</div>
            <Button onClick={() => choose(plan)} disabled={loading === plan.id} data-testid={`choose-plan-button-${plan.id}`} className="mt-8 w-full rounded-full bg-brand-primary py-6 text-white hover:bg-brand-primaryHover"><CreditCard size={17} /> {loading === plan.id ? "Opening…" : plan.id === "free" ? "Start free" : "Upgrade with Stripe"}</Button>
          </article>
        ))}
      </div>
    </PageShell>
  );
}