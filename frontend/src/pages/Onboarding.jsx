import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";
import { languages } from "@/data/platform";

const focusOptions = ["Alcohol", "Opioids", "Fentanyl", "Prescription Opioids", "Heroin", "Stimulants", "Methamphetamine", "Cocaine", "Crack Cocaine", "Cannabis", "Benzodiazepines", "Nicotine/Tobacco", "Gambling", "Gaming", "Pornography/Sexual Behavior", "Food and Eating Behaviors", "Multiple Substances", "Supporting a Loved One", "Mental Wellness Only", "Other"];
const stages = ["Actively using", "Thinking about change", "Preparing to quit", "Early recovery", "Maintaining recovery", "Returning after relapse", "Supporting a loved one"];
const durationOptions = ["Less than 6 months", "6 months to 1 year", "1 to 5 years", "5 to 10 years", "More than 10 years"];
const treatmentOptions = ["No, this is my first time", "Yes, outpatient", "Yes, inpatient/residential", "Yes, support groups", "Multiple recovery attempts", "Currently in treatment"];
const goalOptions = ["Reduce cravings", "Improve mood", "Repair relationships", "Build daily structure", "Strengthen confidence", "Understand recovery"];
const preferenceOptions = ["Short lessons", "Reflection prompts", "Quizzes", "Step-by-step plans", "AI professor coaching", "Journaling"];
const pathwayOptions = ["active-addiction", "early-recovery", "family-member", "faith-based", "mental-wellness", "parenting", "relationships", "financial-freedom", "career-development", "life-skills"];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [primaryFocus, setPrimaryFocus] = useState([]);
  const [duration, setDuration] = useState(durationOptions[0]);
  const [previousSupport, setPreviousSupport] = useState(treatmentOptions[0]);
  const [stage, setStage] = useState(stages[1]);
  const [goals, setGoals] = useState([goalOptions[0]]);
  const [preferences, setPreferences] = useState([preferenceOptions[0]]);
  const [pathways, setPathways] = useState(["early-recovery"]);
  const [language, setLanguage] = useState("en");
  const [journalConsent, setJournalConsent] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const toggle = (list, value, setter) => setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await platformApi.onboarding({ primary_recovery_focus: primaryFocus, duration_affecting_life: duration, previous_treatment_support: previousSupport, recovery_stage: stage, goals, learning_preferences: preferences, support_focus: "balanced", preferred_language: language, pathway_interests: pathways, journal_memory_consent: journalConsent });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Your roadmap could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell eyebrow="Personalized onboarding" title="Shape your first ClearPath roadmap">
      <div className="mb-6 flex gap-2" data-testid="onboarding-step-indicator">
        {[1, 2, 3].map((item) => <span key={item} className={`h-2 flex-1 rounded-full ${step >= item ? "bg-brand-primary" : "bg-brand-border"}`} data-testid={`onboarding-step-${item}`} />)}
      </div>
      {step === 1 && (
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="primary-recovery-focus-section">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid="primary-focus-step-label">Step 1 of 3</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-brand-dark" data-testid="primary-focus-question">What are you currently seeking help with?</h2>
          <p className="mt-2 text-sm text-brand-muted" data-testid="primary-focus-helper">Select all that apply. ClearPath will still teach universal recovery principles while tailoring education, professors, roadmap, quizzes, assignments, reflections, relapse prevention, resources, and community recommendations to your focus.</p>
          <div className="mt-6 flex flex-wrap gap-3" data-testid="primary-focus-options">
            {focusOptions.map((item) => <button key={item} onClick={() => toggle(primaryFocus, item, setPrimaryFocus)} data-testid={`primary-focus-option-${item.toLowerCase().replaceAll("/", "-").replaceAll(" ", "-")}`} className={`rounded-full border px-4 py-2 text-sm transition-colors ${primaryFocus.includes(item) ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal hover:bg-brand-card"}`}>{primaryFocus.includes(item) && <Check className="mr-1 inline" size={14} />} {item}</button>)}
          </div>
          <h3 className="mt-8 font-heading text-2xl font-medium text-brand-dark" data-testid="duration-question">How long has this been affecting your life?</h3>
          <div className="mt-4 flex flex-wrap gap-3" data-testid="duration-options">{durationOptions.map((item) => <button key={item} onClick={() => setDuration(item)} data-testid={`duration-option-${item.toLowerCase().replaceAll(" ", "-")}`} className={`rounded-full border px-4 py-2 text-sm ${duration === item ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal"}`}>{item}</button>)}</div>
          <h3 className="mt-8 font-heading text-2xl font-medium text-brand-dark" data-testid="previous-support-question">Have you received treatment or recovery support before?</h3>
          <div className="mt-4 flex flex-wrap gap-3" data-testid="previous-support-options">{treatmentOptions.map((item) => <button key={item} onClick={() => setPreviousSupport(item)} data-testid={`previous-support-option-${item.toLowerCase().replaceAll("/", "-").replaceAll(",", "").replaceAll(" ", "-")}`} className={`rounded-full border px-4 py-2 text-sm ${previousSupport === item ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal"}`}>{item}</button>)}</div>
          <Button onClick={() => setStep(2)} disabled={primaryFocus.length === 0} data-testid="continue-from-primary-focus-button" className="mt-8 rounded-full bg-brand-primary px-6 py-6 text-white hover:bg-brand-primaryHover">Continue to current stage <ArrowRight size={17} /></Button>
        </section>
      )}
      {step === 2 && (
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="recovery-stage-section">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid="stage-step-label">Step 2 of 3</p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-brand-dark" data-testid="recovery-stage-title">What best describes your current stage?</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {stages.map((item) => <button key={item} onClick={() => setStage(item)} data-testid={`stage-option-${item.toLowerCase().replaceAll(" ", "-")}`} className={`w-full rounded-xl border p-4 text-left transition-colors ${stage === item ? "border-brand-primary bg-brand-card text-brand-primary" : "border-brand-border text-brand-charcoal hover:bg-brand-card"}`}>{item}</button>)}
          </div>
          <div className="mt-8 flex gap-3"><Button variant="outline" onClick={() => setStep(1)} data-testid="back-to-primary-focus-button" className="rounded-full border-brand-border bg-white">Back</Button><Button onClick={() => setStep(3)} data-testid="continue-from-stage-button" className="rounded-full bg-brand-primary px-6 text-white hover:bg-brand-primaryHover">Continue <ArrowRight size={17} /></Button></div>
        </section>
      )}
      {step === 3 && (
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="goals-preferences-section">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid="personalization-step-label">Step 3 of 3</p>
          <h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="goals-title">Goals</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {goalOptions.map((item) => <button key={item} onClick={() => toggle(goals, item, setGoals)} data-testid={`goal-option-${item.toLowerCase().replaceAll(" ", "-")}`} className={`rounded-full border px-4 py-2 text-sm transition-colors ${goals.includes(item) ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal hover:bg-brand-card"}`}>{goals.includes(item) && <Check className="mr-1 inline" size={14} />} {item}</button>)}
          </div>
          <h2 className="mt-8 font-heading text-2xl font-medium text-brand-dark" data-testid="preferences-title">Learning preferences</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {preferenceOptions.map((item) => <button key={item} onClick={() => toggle(preferences, item, setPreferences)} data-testid={`preference-option-${item.toLowerCase().replaceAll(" ", "-")}`} className={`rounded-full border px-4 py-2 text-sm transition-colors ${preferences.includes(item) ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal hover:bg-brand-card"}`}>{preferences.includes(item) && <Check className="mr-1 inline" size={14} />} {item}</button>)}
          </div>
          <h2 className="mt-8 font-heading text-2xl font-medium text-brand-dark" data-testid="pathway-interests-title">Pathway interests</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {pathwayOptions.map((item) => <button key={item} onClick={() => toggle(pathways, item, setPathways)} data-testid={`pathway-interest-${item}`} className={`rounded-full border px-4 py-2 text-sm transition-colors ${pathways.includes(item) ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal hover:bg-brand-card"}`}>{pathways.includes(item) && <Check className="mr-1 inline" size={14} />} {item.replaceAll("-", " ")}</button>)}
          </div>
          <h2 className="mt-8 font-heading text-2xl font-medium text-brand-dark" data-testid="language-title">Preferred language</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {languages.map((item) => <button key={item.code} onClick={() => setLanguage(item.code)} data-testid={`onboarding-language-${item.code}`} className={`rounded-full border px-4 py-2 text-sm transition-colors ${language === item.code ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal hover:bg-brand-card"}`}>{item.name}</button>)}
          </div>
          <button onClick={() => setJournalConsent(!journalConsent)} data-testid="journal-memory-consent-toggle" className={`mt-5 rounded-xl border p-4 text-left text-sm ${journalConsent ? "border-brand-primary bg-brand-card text-brand-charcoal" : "border-brand-border bg-white text-brand-muted"}`}>{journalConsent ? "Journal insights may personalize professor memory." : "Journal insights will not be used for professor memory."}</button>
          <div className="mt-8 rounded-2xl bg-brand-card p-5" data-testid="roadmap-preview-box">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid="roadmap-preview-label">Roadmap preview</p>
            <p className="mt-2 text-brand-charcoal" data-testid="roadmap-preview-text">Your first plan will combine {primaryFocus.slice(0, 2).join(" + ")}, {duration.toLowerCase()}, {previousSupport.toLowerCase()}, {stage.toLowerCase()}, {goals.slice(0, 2).join(" and ") || "personal goals"}, and {preferences.slice(0, 2).join(" + ") || "guided learning"}.</p>
          </div>
          {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-brand-error" data-testid="onboarding-error-message">{error}</p>}
          <div className="mt-6 flex gap-3"><Button variant="outline" onClick={() => setStep(2)} data-testid="back-to-stage-button" className="rounded-full border-brand-border bg-white">Back</Button><Button onClick={submit} disabled={saving || goals.length === 0 || preferences.length === 0 || primaryFocus.length === 0} data-testid="save-onboarding-button" className="rounded-full bg-brand-primary px-6 py-6 text-white hover:bg-brand-primaryHover">{saving ? "Creating roadmap…" : "Generate my roadmap"} <ArrowRight size={17} /></Button></div>
        </section>
      )}
    </PageShell>
  );
}