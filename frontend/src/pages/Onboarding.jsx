import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

const stages = ["Exploring recovery", "Early recovery", "Rebuilding routines", "Long-term growth", "Supporting family"];
const goalOptions = ["Reduce cravings", "Improve mood", "Repair relationships", "Build daily structure", "Strengthen confidence", "Understand recovery"];
const preferenceOptions = ["Short lessons", "Reflection prompts", "Quizzes", "Step-by-step plans", "AI professor coaching", "Journaling"];

export default function Onboarding() {
  const [stage, setStage] = useState(stages[0]);
  const [goals, setGoals] = useState([goalOptions[0]]);
  const [preferences, setPreferences] = useState([preferenceOptions[0]]);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const toggle = (list, value, setter) => setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  const submit = async () => {
    setSaving(true);
    await platformApi.onboarding({ recovery_stage: stage, goals, learning_preferences: preferences, support_focus: "balanced" });
    navigate("/dashboard");
  };

  return (
    <PageShell eyebrow="Personalized onboarding" title="Shape your first ClearPath roadmap">
      <div className="grid gap-6 lg:grid-cols-3" data-testid="onboarding-grid">
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-1" data-testid="recovery-stage-section">
          <h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="recovery-stage-title">Recovery stage</h2>
          <div className="mt-5 space-y-3">
            {stages.map((item) => <button key={item} onClick={() => setStage(item)} data-testid={`stage-option-${item.toLowerCase().replaceAll(" ", "-")}`} className={`w-full rounded-xl border p-4 text-left transition-colors ${stage === item ? "border-brand-primary bg-brand-card text-brand-primary" : "border-brand-border text-brand-charcoal hover:bg-brand-card"}`}>{item}</button>)}
          </div>
        </section>
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2" data-testid="goals-preferences-section">
          <h2 className="font-heading text-2xl font-medium text-brand-dark" data-testid="goals-title">Goals</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {goalOptions.map((item) => <button key={item} onClick={() => toggle(goals, item, setGoals)} data-testid={`goal-option-${item.toLowerCase().replaceAll(" ", "-")}`} className={`rounded-full border px-4 py-2 text-sm transition-colors ${goals.includes(item) ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal hover:bg-brand-card"}`}>{goals.includes(item) && <Check className="mr-1 inline" size={14} />} {item}</button>)}
          </div>
          <h2 className="mt-8 font-heading text-2xl font-medium text-brand-dark" data-testid="preferences-title">Learning preferences</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {preferenceOptions.map((item) => <button key={item} onClick={() => toggle(preferences, item, setPreferences)} data-testid={`preference-option-${item.toLowerCase().replaceAll(" ", "-")}`} className={`rounded-full border px-4 py-2 text-sm transition-colors ${preferences.includes(item) ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal hover:bg-brand-card"}`}>{preferences.includes(item) && <Check className="mr-1 inline" size={14} />} {item}</button>)}
          </div>
          <div className="mt-8 rounded-2xl bg-brand-card p-5" data-testid="roadmap-preview-box">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid="roadmap-preview-label">Roadmap preview</p>
            <p className="mt-2 text-brand-charcoal" data-testid="roadmap-preview-text">Your first plan will combine {stage.toLowerCase()}, {goals.slice(0, 2).join(" and ") || "personal goals"}, and {preferences.slice(0, 2).join(" + ") || "guided learning"}.</p>
          </div>
          <Button onClick={submit} disabled={saving || goals.length === 0 || preferences.length === 0} data-testid="save-onboarding-button" className="mt-6 rounded-full bg-brand-primary px-6 py-6 text-white hover:bg-brand-primaryHover">{saving ? "Creating roadmap…" : "Generate my roadmap"} <ArrowRight size={17} /></Button>
        </section>
      </div>
    </PageShell>
  );
}