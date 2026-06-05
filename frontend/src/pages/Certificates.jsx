import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";
import { media } from "@/data/platform";

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { platformApi.certificates().then(({ data }) => setCertificates(data.certificates)).catch(() => setError("Certificates could not load.")); }, []);
  return (
    <PageShell eyebrow="Achievements" title="Certificates earned">
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error" data-testid="certificates-error-message">{error}</div>}
      <div className="grid gap-6 md:grid-cols-2" data-testid="certificates-grid">
        {certificates.map((certificate) => <article key={certificate.id} className="relative overflow-hidden rounded-2xl border border-brand-border bg-white p-8" data-testid={`certificate-card-${certificate.id}`}><img src={media.texture} alt="Warm sand texture" className="absolute inset-0 h-full w-full object-cover opacity-10" data-testid={`certificate-background-${certificate.id}`} /><div className="relative"><Award className="mb-5 text-brand-primary" size={40} /><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid={`certificate-label-${certificate.id}`}>Certificate of completion</p><h2 className="mt-3 font-heading text-3xl font-semibold text-brand-dark" data-testid={`certificate-course-${certificate.id}`}>{certificate.course_title}</h2><p className="mt-6 text-brand-charcoal" data-testid={`certificate-student-${certificate.id}`}>Awarded to {certificate.student_name}</p></div></article>)}
        {certificates.length === 0 && <div className="rounded-2xl border border-brand-border bg-white p-8 text-center" data-testid="empty-certificates-state">Complete a course to earn your first certificate.</div>}
      </div>
    </PageShell>
  );
}