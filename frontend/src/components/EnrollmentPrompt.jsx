import { Link } from "react-router-dom";
import { LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EnrollmentPrompt({ title = "Create your free account to continue your personalized recovery journey.", text = "Enrollment unlocks personalized roadmaps, full lessons, AI Professor conversations, progress tracking, journals, certificates, live classes, replays, and support tickets." }) {
  return (
    <section className="rounded-2xl border border-brand-border bg-white p-8 text-center" data-testid="enrollment-prompt">
      <LockKeyhole className="mx-auto mb-4 text-brand-primary" size={34} />
      <h2 className="mx-auto max-w-2xl font-heading text-3xl font-semibold text-brand-dark" data-testid="enrollment-prompt-title">{title}</h2>
      <p className="mx-auto mt-3 max-w-2xl text-brand-muted" data-testid="enrollment-prompt-text">{text}</p>
      <Button asChild data-testid="enrollment-prompt-create-account" className="mt-6 rounded-full bg-brand-primary px-6 py-6 text-white hover:bg-brand-primaryHover"><Link to="/auth"><Sparkles size={17} /> Create free account</Link></Button>
    </section>
  );
}