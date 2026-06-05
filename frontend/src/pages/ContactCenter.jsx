import { useEffect, useState } from "react";
import { Mail, Phone, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function ContactCenter() {
  const [support, setSupport] = useState(null);
  const [note, setNote] = useState("");
  useEffect(() => { platformApi.support().then(({ data }) => setSupport(data)); }, []);
  return (
    <PageShell eyebrow="Contact center" title="ClearPath support resources">
      <div className="grid gap-6 lg:grid-cols-3" data-testid="contact-center-grid">
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="contact-phone-card"><Phone className="mb-3 text-brand-primary" /><h2 className="font-heading text-2xl text-brand-dark">Phone</h2><p data-testid="contact-phone-value" className="mt-2 text-brand-charcoal">{support?.phone}</p><p className="text-sm text-brand-muted" data-testid="contact-hours-value">{support?.hours}</p></section>
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="contact-email-card"><Mail className="mb-3 text-brand-primary" /><h2 className="font-heading text-2xl text-brand-dark">Email</h2><p data-testid="contact-email-value" className="mt-2 text-brand-charcoal">{support?.contact}</p></section>
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="emergency-resources-card"><ShieldAlert className="mb-3 text-brand-error" /><h2 className="font-heading text-2xl text-brand-dark">Emergency resources</h2><p className="mt-2 text-sm text-brand-muted" data-testid="emergency-note">{support?.crisis_note}</p></section>
      </div>
      <section className="mt-6 rounded-2xl border border-brand-border bg-white p-6" data-testid="contact-form-card"><h2 className="font-heading text-2xl text-brand-dark">Contact form</h2><Textarea value={note} onChange={(e) => setNote(e.target.value)} data-testid="contact-form-message" className="mt-4 rounded-xl border-brand-border" placeholder="Write a support note…" /><Button data-testid="contact-form-submit" className="mt-3 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Save note for support</Button></section>
      <section className="mt-6 rounded-2xl border border-brand-border bg-white p-6" data-testid="faq-card"><h2 className="font-heading text-2xl text-brand-dark">FAQs</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{(support?.faqs || []).map((faq) => <div key={faq} className="rounded-xl bg-brand-card p-4 text-brand-charcoal" data-testid={`faq-${faq.toLowerCase().replaceAll(" ", "-").replaceAll("?", "")}`}>{faq}</div>)}</div></section>
    </PageShell>
  );
}