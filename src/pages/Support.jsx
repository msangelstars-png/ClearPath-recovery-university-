import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { SUPPORT_INFO } from '@/data/platform';

export default function Support() {
  return (
    <PageShell eyebrow="Support center" title="Help for students and families">
      <section className="rounded-2xl border border-brand-border bg-white p-8">
        <LifeBuoy className="mb-4 text-brand-primary" size={34} />
        <p className="max-w-3xl text-brand-charcoal">
          Find help for account access, course progress, AI professor use, subscriptions, certificates, and family support learning.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {SUPPORT_INFO.topics.map((topic) => (
            <div key={topic} className="rounded-xl bg-brand-card p-4">
              <HelpCircle className="mb-2 text-brand-primary" size={18} />
              {topic}
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-brand-border p-4">
          <p className="font-medium text-brand-dark">{SUPPORT_INFO.contact}</p>
          <p className="mt-1 text-sm text-brand-charcoal">{SUPPORT_INFO.phone}</p>
          <p className="mt-1 text-sm text-brand-muted">{SUPPORT_INFO.hours}</p>
          <p className="mt-2 text-sm text-brand-muted">{SUPPORT_INFO.crisis_note}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
              <Link to="/tickets">Create support ticket</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-brand-border bg-white">
              <Link to="/contact-center">Contact center</Link>
            </Button>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
