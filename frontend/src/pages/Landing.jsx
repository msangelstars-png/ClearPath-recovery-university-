import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Award, Brain, HeartHandshake, School, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopNav } from "@/components/Layout";
import { media, phasePreview } from "@/data/platform";
import { platformApi } from "@/services/api";

const pillars = [
  [HeartHandshake, "Recovery", "Personalized support for rebuilding trust, routines, and next steps."],
  [Brain, "Mental wellness", "Daily emotional awareness, journaling, mood tracking, and grounding lessons."],
  [Award, "Life skills", "Practical courses that turn goals into repeatable habits and milestones."],
  [ShieldCheck, "Family support", "Guided communication, boundaries, repair, and education for loved ones."],
];

export default function Landing() {
  const [preview, setPreview] = useState({ sample_lessons: [], success_stories: [] });
  useEffect(() => { platformApi.publicPreview().then(({ data }) => setPreview(data)).catch(() => {}); }, []);
  return (
    <main className="min-h-screen bg-brand-base" data-testid="landing-page">
      <TopNav />
      <section className="relative overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img src={media.hero} alt="Sunrise over peaceful green landscape" className="h-full w-full object-cover object-center" data-testid="hero-background-image" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-base via-brand-base/90 to-brand-base/35" />
        </div>
        <div className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl animate-rise-in">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid="hero-eyebrow">AI-powered personalized recovery university</p>
            <h1 className="font-heading text-5xl font-semibold leading-none text-brand-dark sm:text-6xl" data-testid="hero-title">Recovery is personal. Your education should be too.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-brand-charcoal" data-testid="hero-subtitle">ClearPath combines onboarding, adaptive learning paths, AI professors, progress tracking, journaling, certificates, and subscriptions in one warm university experience.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild data-testid="hero-create-account-button" className="rounded-full bg-brand-primary px-6 py-6 text-white hover:bg-brand-primaryHover"><Link to="/auth">Create your student account <ArrowRight size={17} /></Link></Button>
              <Button asChild variant="outline" data-testid="hero-browse-schools-button" className="rounded-full border-brand-border bg-white/80 px-6 py-6"><Link to="/schools">Browse schools</Link></Button>
              <Button asChild variant="outline" data-testid="hero-preview-phases-button" className="rounded-full border-brand-border bg-white/80 px-6 py-6"><Link to="/preview">Preview future phases</Link></Button>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8" data-testid="mvp-pillars-section">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">University preview</p><h2 className="mt-2 font-heading text-3xl font-semibold text-brand-dark">Browse before enrollment</h2></div><Button asChild variant="outline" data-testid="landing-pricing-link" className="rounded-full border-brand-border bg-white"><Link to="/plans">View pricing</Link></Button></div>
        <div className="grid gap-5 md:grid-cols-4">
          {pillars.map(([Icon, title, text]) => (
            <article key={title} className="rounded-2xl border border-brand-border bg-white p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-md" data-testid={`pillar-card-${title.toLowerCase().replaceAll(" ", "-")}`}>
              <Icon className="mb-5 text-brand-primary" />
              <h2 className="font-heading text-xl font-medium text-brand-dark" data-testid={`pillar-title-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-brand-muted" data-testid={`pillar-text-${title.toLowerCase().replaceAll(" ", "-")}`}>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8" data-testid="visitor-features-section"><div className="grid gap-5 md:grid-cols-3"><article className="rounded-2xl border border-brand-border bg-white p-6" data-testid="visitor-feature-schools"><School className="mb-3 text-brand-primary" /><h3 className="font-heading text-2xl text-brand-dark">Preview schools and programs</h3><p className="mt-2 text-sm text-brand-muted">Explore schools, program descriptions, AI Professor directory, sample lessons, pricing, and features.</p></article><article className="rounded-2xl border border-brand-border bg-white p-6" data-testid="visitor-feature-enrollment"><Star className="mb-3 text-brand-primary" /><h3 className="font-heading text-2xl text-brand-dark">Enroll for personalization</h3><p className="mt-2 text-sm text-brand-muted">Create a free account to unlock roadmaps, full lessons, AI conversations, journals, live classes, certificates, and progress tracking.</p></article><article className="rounded-2xl border border-brand-border bg-white p-6" data-testid="visitor-feature-stories"><HeartHandshake className="mb-3 text-brand-primary" /><h3 className="font-heading text-2xl text-brand-dark">Success stories</h3><p className="mt-2 text-sm text-brand-muted">Students use ClearPath for structure, recovery skills, family support, and long-term growth.</p></article></div></section>
      <section id="sample-lessons" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8" data-testid="sample-lessons-section">
        <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Sample lessons</p><h2 className="mt-2 font-heading text-3xl font-semibold text-brand-dark">Preview the classroom before enrolling</h2></div>
        <div className="grid gap-5 md:grid-cols-3">{preview.sample_lessons.slice(0, 6).map((lesson) => <article key={lesson.id} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`sample-lesson-${lesson.id}`}><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid={`sample-lesson-course-${lesson.id}`}>{lesson.course_id}</p><h3 className="mt-3 font-heading text-xl text-brand-dark" data-testid={`sample-lesson-title-${lesson.id}`}>{lesson.title}</h3><p className="mt-3 text-sm text-brand-muted" data-testid={`sample-lesson-content-${lesson.id}`}>{lesson.sample_content}</p><Button asChild variant="outline" data-testid={`sample-lesson-enroll-${lesson.id}`} className="mt-5 rounded-full border-brand-border bg-white"><Link to="/auth">Unlock full lesson</Link></Button></article>)}</div>
      </section>
      <section id="success-stories" className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8" data-testid="success-stories-section">
        <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Success stories</p><h2 className="mt-2 font-heading text-3xl font-semibold text-brand-dark">Realistic student journeys</h2></div>
        <div className="grid gap-5 md:grid-cols-3">{preview.success_stories.map((story) => <article key={story.name} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`success-story-${story.name.toLowerCase()}`}><Star className="mb-3 text-brand-primary" /><h3 className="font-heading text-2xl text-brand-dark" data-testid={`success-story-name-${story.name.toLowerCase()}`}>{story.name}</h3><p className="mt-3 text-sm text-brand-muted" data-testid={`success-story-text-${story.name.toLowerCase()}`}>{story.story}</p></article>)}</div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-16 sm:px-6 lg:grid-cols-5 lg:px-8" data-testid="future-preview-strip">
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-white lg:col-span-2">
          <img src={media.campus} alt="Modern sunny campus building" className="aspect-[4/3] w-full object-cover" data-testid="campus-preview-image" />
        </div>
        <div className="grid gap-4 lg:col-span-3">
          {phasePreview.map((phase) => (
            <div key={phase.phase} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`phase-card-${phase.phase.toLowerCase().replaceAll(" ", "-")}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary" data-testid={`phase-label-${phase.phase}`}>{phase.phase}</p>
              <h3 className="mt-2 font-heading text-2xl font-medium text-brand-dark" data-testid={`phase-title-${phase.phase}`}>{phase.title}</h3>
              <div className="mt-4 flex flex-wrap gap-2">{phase.items.map((item) => <span key={item} className="rounded-full bg-brand-card px-3 py-1 text-sm text-brand-charcoal" data-testid={`phase-item-${item.toLowerCase().replaceAll(" ", "-")}`}>{item}</span>)}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}