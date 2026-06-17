import { Link } from 'react-router-dom';
import { Heart, LifeBuoy, Mail, Phone, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { SUPPORT_INFO } from '@/data/platform';

const crisisResources = [
  { name: 'Suicide & Crisis Lifeline', contact: 'Call or text 988', note: 'Available 24/7 for mental health and substance use crises', urgent: true },
  { name: 'Crisis Text Line', contact: 'Text HOME to 741741', note: 'Free, confidential crisis counseling via text', urgent: true },
  { name: 'SAMHSA National Helpline', contact: '1-800-662-4357', note: 'Free treatment referral and information service, 24/7', urgent: false },
  { name: 'National Domestic Violence Hotline', contact: '1-800-799-7233', note: 'Safety planning and crisis support', urgent: false },
];

const contactChannels = [
  { icon: Mail, label: 'Email support', value: SUPPORT_INFO.contact, note: 'Response within 1 business day', cta: 'Open ticket', href: '/tickets' },
  { icon: Phone, label: 'Phone support', value: SUPPORT_INFO.phone, note: SUPPORT_INFO.hours, cta: null, href: null },
  { icon: Ticket, label: 'Support ticket', value: 'Create a detailed support request', note: 'Track status and get written responses', cta: 'New ticket', href: '/tickets' },
];

const faqs = SUPPORT_INFO.faqs;

export default function ContactCenter() {
  return (
    <PageShell eyebrow="Contact center" title="We're here to help">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-brand-border bg-white p-6">
            <h2 className="mb-5 font-heading text-2xl text-brand-dark">Contact channels</h2>
            <div className="space-y-4">
              {contactChannels.map((ch) => (
                <div key={ch.label} className="flex items-start gap-4 rounded-xl bg-brand-card p-4">
                  <ch.icon className="mt-0.5 shrink-0 text-brand-primary" size={22} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-brand-dark">{ch.label}</p>
                    <p className="mt-0.5 text-sm text-brand-charcoal">{ch.value}</p>
                    <p className="mt-0.5 text-xs text-brand-muted">{ch.note}</p>
                  </div>
                  {ch.cta && (
                    <Button asChild size="sm" className="shrink-0 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
                      <Link to={ch.href}>{ch.cta}</Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-border bg-white p-6">
            <h2 className="mb-5 font-heading text-2xl text-brand-dark">Frequently asked questions</h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq} className="rounded-xl bg-brand-card p-4 text-sm text-brand-charcoal">
                  {faq}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-brand-muted">
              Didn't find your answer?{' '}
              <Link to="/tickets" className="text-brand-primary underline">Open a support ticket</Link> and we'll respond within 1 business day.
            </p>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-2 text-red-700">
              <Heart size={20} />
              <h2 className="font-heading text-xl font-semibold">Crisis resources</h2>
            </div>
            <p className="mt-2 text-sm text-red-700/80">
              If you or someone you know is in immediate danger or experiencing a mental health crisis, please reach out now.
            </p>
            <div className="mt-4 space-y-3">
              {crisisResources.map((r) => (
                <div
                  key={r.name}
                  className={`rounded-xl p-4 ${r.urgent ? 'bg-red-100 border border-red-200' : 'bg-white border border-red-100'}`}
                >
                  <p className={`font-semibold ${r.urgent ? 'text-red-700' : 'text-brand-dark'}`}>{r.name}</p>
                  <p className={`mt-0.5 text-sm font-medium ${r.urgent ? 'text-red-600' : 'text-brand-primary'}`}>{r.contact}</p>
                  <p className="mt-0.5 text-xs text-brand-muted">{r.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-border bg-white p-6">
            <LifeBuoy className="mb-3 text-brand-primary" size={26} />
            <h2 className="font-heading text-xl text-brand-dark">Support topics</h2>
            <ul className="mt-3 space-y-2">
              {SUPPORT_INFO.topics.map((topic) => (
                <li key={topic} className="text-sm text-brand-charcoal">· {topic}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
