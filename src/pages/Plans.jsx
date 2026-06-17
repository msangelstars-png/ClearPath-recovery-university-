import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sparkles, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { PLANS } from '@/data/platform';

const icons = { free: Sparkles, premium: Zap, premium_annual: Star };
const highlights = { free: false, premium: true, premium_annual: false };

export default function Plans() {
  const { currentUser } = useAuth();
  const [billing, setBilling] = useState('monthly');

  const displayedPlans = billing === 'annual'
    ? PLANS.filter((p) => p.id !== 'premium')
    : PLANS.filter((p) => p.id !== 'premium_annual');

  const currentPlan = currentUser?.plan || 'free';

  return (
    <PageShell eyebrow="Pricing" title="Invest in your recovery">
      <div className="mx-auto max-w-4xl">
        <p className="mb-8 text-lg text-brand-charcoal">
          Start free. Upgrade when you're ready. Every plan includes AI professor access and progress tracking.
        </p>

        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-full border border-brand-border bg-white p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${billing === 'monthly' ? 'bg-brand-primary text-white' : 'text-brand-charcoal hover:text-brand-dark'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${billing === 'annual' ? 'bg-brand-primary text-white' : 'text-brand-charcoal hover:text-brand-dark'}`}
            >
              Annual <span className="ml-1 rounded-full bg-brand-success/20 px-2 py-0.5 text-xs text-brand-success">Save 43%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {displayedPlans.map((plan) => {
            const Icon = icons[plan.id];
            const isHighlighted = highlights[plan.id] || (billing === 'annual' && plan.id === 'premium_annual');
            const isCurrent = currentPlan === plan.id || (currentPlan === 'premium' && (plan.id === 'premium' || plan.id === 'premium_annual'));
            return (
              <article
                key={plan.id}
                className={`relative rounded-2xl border p-8 ${isHighlighted ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-border bg-white'}`}
              >
                {isHighlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-primaryHover px-4 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <Icon size={24} className={isHighlighted ? 'text-white/80' : 'text-brand-primary'} />
                  <h2 className={`font-heading text-2xl font-semibold ${isHighlighted ? 'text-white' : 'text-brand-dark'}`}>{plan.name}</h2>
                </div>
                <div className="mt-5">
                  <span className={`font-heading text-5xl font-bold ${isHighlighted ? 'text-white' : 'text-brand-dark'}`}>
                    {plan.amount === 0 ? 'Free' : `$${plan.amount}`}
                  </span>
                  {plan.amount > 0 && (
                    <span className={`ml-2 text-sm ${isHighlighted ? 'text-white/70' : 'text-brand-muted'}`}>
                      /{billing === 'annual' ? 'year' : 'month'}
                    </span>
                  )}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${isHighlighted ? 'text-white/80' : 'text-brand-success'}`} />
                      <span className={`text-sm ${isHighlighted ? 'text-white/90' : 'text-brand-charcoal'}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {isCurrent ? (
                    <div className={`rounded-full py-3 text-center text-sm font-medium ${isHighlighted ? 'bg-white/20 text-white' : 'bg-brand-card text-brand-charcoal'}`}>
                      Current plan
                    </div>
                  ) : currentUser ? (
                    <Button
                      asChild
                      className={`w-full rounded-full ${isHighlighted ? 'bg-white text-brand-primary hover:bg-white/90' : 'bg-brand-primary text-white hover:bg-brand-primaryHover'}`}
                    >
                      <Link to="/settings">
                        {plan.amount === 0 ? 'Downgrade to Free' : 'Upgrade now'}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className={`w-full rounded-full ${isHighlighted ? 'bg-white text-brand-primary hover:bg-white/90' : 'bg-brand-primary text-white hover:bg-brand-primaryHover'}`}
                    >
                      <Link to="/auth">
                        {plan.amount === 0 ? 'Start free' : 'Get started'}
                      </Link>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-brand-border bg-white p-6 text-center">
          <p className="font-heading text-lg text-brand-dark">Need financial assistance?</p>
          <p className="mt-2 text-sm text-brand-charcoal">
            ClearPath offers sliding-scale pricing for those in financial hardship. Contact us to learn more.
          </p>
          <Button asChild variant="outline" className="mt-4 rounded-full border-brand-border">
            <Link to="/contact-center">Contact support</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
