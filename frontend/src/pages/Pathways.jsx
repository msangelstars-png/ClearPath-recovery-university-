import { useEffect, useState } from "react";
import { Brain, Check, Languages, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function Pathways() {
  const [pathways, setPathways] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [language, setLanguage] = useState("en");
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    Promise.all([platformApi.pathways(), platformApi.learningPlan()]).then(([paths, current]) => {
      setPathways(paths.data.pathways);
      setLanguages(paths.data.languages);
      setPlan(current.data.learning_plan);
      setSelected((current.data.learning_plan?.weekly_plan || []).map((item) => item.pathway_id));
    });
  }, []);
  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  const save = async () => {
    const { data } = await platformApi.saveLearningPlan({ pathway_ids: selected, intensity: "balanced", preferred_language: language });
    setPlan(data.learning_plan);
    setMessage("Your individualized learning plan has been updated and saved across logins.");
  };
  return (
    <PageShell eyebrow="Individualized learning plans" title="Choose pathways that match your story">
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success" data-testid="learning-plan-message">{message}</div>}
      <section className="mb-6 rounded-2xl border border-brand-border bg-white p-6" data-testid="language-selector-card">
        <div className="flex items-center gap-3"><Languages className="text-brand-primary" /><h2 className="font-heading text-2xl text-brand-dark">Class and material language</h2></div>
        <div className="mt-4 flex flex-wrap gap-2">{languages.map((item) => <button key={item.code} onClick={() => setLanguage(item.code)} data-testid={`language-option-${item.code}`} className={`rounded-full border px-4 py-2 text-sm ${language === item.code ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal"}`}>{item.name}</button>)}</div>
      </section>
      <div className="grid gap-5 md:grid-cols-2" data-testid="pathways-grid">
        {pathways.map((pathway) => <article key={pathway.id} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`pathway-card-${pathway.id}`}><div className="flex items-start justify-between gap-3"><Route className="text-brand-primary" /><button onClick={() => toggle(pathway.id)} data-testid={`pathway-toggle-${pathway.id}`} className={`rounded-full border px-3 py-2 text-sm ${selected.includes(pathway.id) ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border"}`}>{selected.includes(pathway.id) ? <Check size={15} /> : "Add"}</button></div><h2 className="mt-4 font-heading text-2xl text-brand-dark" data-testid={`pathway-title-${pathway.id}`}>{pathway.title}</h2><p className="mt-2 text-sm text-brand-muted" data-testid={`pathway-description-${pathway.id}`}>{pathway.description}</p><p className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-card px-3 py-1 text-sm text-brand-charcoal" data-testid={`pathway-level-${pathway.id}`}><Brain size={15} /> {pathway.level}</p></article>)}
      </div>
      <Button onClick={save} disabled={selected.length === 0} data-testid="save-learning-plan-button" className="mt-6 rounded-full bg-brand-primary px-6 py-6 text-white hover:bg-brand-primaryHover">Save individualized learning plan</Button>
      {plan && <section className="mt-8 rounded-2xl border border-brand-border bg-white p-6" data-testid="current-learning-plan-card"><h2 className="font-heading text-2xl text-brand-dark" data-testid="current-learning-plan-title">Current plan</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{(plan.weekly_plan || []).map((week) => <div key={`${week.week}-${week.pathway_id}`} className="rounded-xl bg-brand-card p-4" data-testid={`learning-plan-week-${week.week}`}><p className="font-medium text-brand-dark">Week {week.week}: {week.title}</p><p className="mt-2 text-sm text-brand-muted">{week.actions[0]}</p></div>)}</div></section>}
    </PageShell>
  );
}