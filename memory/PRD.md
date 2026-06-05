# ClearPath Recovery University — Product Requirements Document

## Original Problem Statement
Build a fully functional platform called ClearPath Recovery University: a personalized AI-powered recovery, mental wellness, life skills, family support, and personal transformation university. Phase 1 MVP includes public landing page, custom user registration/authentication, personalized onboarding, recovery stage assessment, goal setting, learning preference selection, personalized roadmap generation, student dashboard, AI Professor system with memory, school/course enrollment, lessons, quizzes, reflection exercises, daily check-ins, mood tracking, journaling, progress tracking, certificates, Stripe subscriptions, basic support center, responsive design, and admin panel. User selected Phase 1 MVP plus Phase 2/3 preview page, JWT auth, GPT-5.2 AI professors using Emergent LLM key, and Stripe checkout for Free/Premium plans.

## Architecture Decisions
- Frontend: React with React Router, Tailwind CSS, Shadcn UI components, responsive bento-style dashboard, warm organic design system from `/app/design_guidelines.json`.
- Backend: FastAPI with `/api` routes, MongoDB via existing `MONGO_URL`, JWT authentication, role-based admin access, and protected student APIs.
- AI: GPT-5.2 via Emergent LLM integration with streamed responses, professor-specific prompts, persistent `ai_messages`, and `ai_memories` collections.
- Payments: Stripe checkout integration through backend-defined plans only, `payment_transactions` collection, dynamic success/cancel URLs, and payment status polling endpoint.
- Data: MongoDB collections include users, assessments, schools, courses, lessons, enrollments, reflections, daily_checkins, journal_entries, certificates, ai_messages, ai_memories, subscriptions, and payment_transactions.

## User Personas
- New Student: needs warm onboarding, recovery-stage assessment, personalized roadmap, and simple first lessons.
- Returning Student: needs dashboard access, progress, check-ins, journaling, AI guidance, and course continuation.
- Premium Student: needs full course access, certificates, and AI professor support.
- Family Support Learner: needs family recovery education and communication repair tools.
- Admin: needs high-level visibility into users, courses, enrollments, payments, and analytics.

## Core Requirements
- Public marketing entry with clear university identity.
- Secure email/password registration and login with JWT.
- Personalized onboarding that stores goals, recovery stage, preferences, and roadmap.
- Dashboard with learning path, progress, goals, streaks, certificates, recommendations, and notifications.
- Schools: Recovery, Mental Wellness, Life Skills, Family Recovery.
- AI Professors: Hope, Insight, Compass, Bridge.
- Lessons with quiz and reflection completion, progress tracking, and certificates.
- Daily check-ins, mood tracking, journaling, and sentiment tags.
- Free and Premium subscription plans with Stripe checkout flow.
- Support center and admin panel.
- Phase 2/3 preview page.
- Mobile-friendly responsive layout.

## Implemented — 2026-06-05
- Built full React application with landing, auth, onboarding, dashboard, schools, courses, lessons, AI professors, journal/check-ins, plans, roadmap, support, certificates, preview, and admin routes.
- Built FastAPI backend with JWT auth, MongoDB persistence, seeded school/course/lesson catalog, onboarding roadmap generation, enrollments, lesson completion, certificates, journal/check-ins, AI streamed chat, Stripe checkout, payment polling, support, and admin summary APIs.
- Added deterministic local test credentials in `/app/memory/test_credentials.md` for repeatable testing.
- Testing agent validated backend + frontend flows; backend tests passed 10/10 and core UI flows passed.
- Added user-visible error handling for major API-driven pages.

## Validation Summary
- Backend curl validation passed for health, registration, onboarding, dashboard, courses, and admin summary.
- Browser validation passed for landing, auth, login, and dashboard rendering.
- Testing agent report: `/app/test_reports/iteration_1.json`.

## Prioritized Backlog
### P0 Remaining
- Add production-grade password reset/email verification.
- Add Stripe webhook hardening with signature/environment handling for real production billing.
- Add clinical safety escalation workflows and crisis-resource localization.

### P1 Remaining
- Build richer course authoring/admin CRUD tools.
- Add downloadable certificate PDFs.
- Add deeper AI memory summarization and semantic retrieval.
- Add notification scheduler for reminders.
- Add Family Plan functionality.

### P2 Remaining
- Community groups, posts, comments, moderation, and messaging.
- Audio/video lessons and worksheets.
- Multi-language support.
- Enterprise dashboards, audit logs, and role-based organizational permissions.
- Live AI classes, voice AI, and AI video professor experiences.

## Next Tasks
1. Expand course library content for all four MVP schools.
2. Add profile settings and password recovery flows.
3. Add richer analytics charts for admin and student progress.
4. Turn certificates into downloadable/printable documents.
5. Add reminder scheduling for daily check-ins and lesson continuation.


## Expansion Implemented — 2026-06-05
- Added 12 specialized AI professors with dedicated schools, personalities, teaching styles, voice/avatar metadata, expertise areas, and memory-aware prompts: Hope, Insight, Grace, Compass, Bridge, Nurture, Prosper, Horizon, Strength, Freedom, Voice, and Legacy.
- Expanded schools/pathways for active addiction, recovery, family members, faith-based recovery, mental wellness, parenting, relationships, financial freedom, career development, physical wellness, relapse prevention, purpose/leadership, and life skills.
- Added individualized learning plans based on onboarding profile, pathway interests, preferred language, learning style, goals, recovery stage, and journal-memory consent.
- Added multilingual support metadata for English, Spanish, French, Portuguese, German, and Arabic across pathways/classes/materials.
- Added live learning ecosystem: class catalog, classroom pages, attendance tracking, participation Q&A, replay/transcript sections, written lesson versions, class completion, and class certificates.
- Added support ticket system with tracking numbers, categories, priority levels, attachment URL metadata, AI triage text, statuses, student history, ratings-ready schema, and admin support inbox with internal notes/status updates.
- Added contact center page with phone, email, FAQs, support form, and emergency resource messaging.
- Added downloadable certificate action and responsive navigation improvements for expanded routes.
- Persistence verified for learning plans, support tickets, class attendance, class Q&A, certificates, coursework, journals, assessments, and professor conversations through MongoDB.

## Expansion Validation — 2026-06-05
- Backend expanded ecosystem regression tests passed 7/7: `/app/backend/tests/test_expanded_learning_ecosystem.py`.
- Frontend regression after fixes passed: certificate rendering/download, mobile overflow, pathways, classes, tickets, and admin support routes.
- Reports: `/app/test_reports/iteration_2.json`, `/app/test_reports/iteration_3.json`.

## Notes / Future Integration Work
- Live classroom currently provides an in-app AI classroom stage, text Q&A, captions/transcript/replay/written lesson flows, attendance, participation, and certificates. Future work can connect real-time video avatar, speech-to-text, and voice conversation providers.
- File attachment support currently stores attachment URL metadata for tickets. Future work can connect object storage for direct uploaded files/videos.


## Phase 2 Implementation — 2026-06-05
- Added complete semester program framework for every school with Beginner, Intermediate, Advanced, and Mastery tracks.
- Each program now includes modules, representative lessons, quizzes, assignments, milestones, certificates, progress tracking, and graduation pathways.
- Added assignment submission persistence and program progress updates, with semester-track certificate creation when tracks are completed.
- Implemented permanent object storage integration for uploads through backend-controlled endpoints: student documents, assignments, support attachments, profile photos, certificates, and replay/recording assets.
- Added file metadata in MongoDB with encrypted flag, soft-delete, role-based access rules, purpose tags, canonical storage paths, and download endpoints.
- Added student data export including profiles, onboarding, recovery plans, journals, assignments, quiz/course progress, certificates, AI conversations, class attendance, event attendance, support tickets, uploaded file metadata, and voice sessions.
- Added provider-ready AI voice/video professor architecture: voice sessions, session history, professor voice/avatar metadata, text/TTS fallback, WebRTC/provider readiness fields, and persistent voice session metadata.
- Added Voice Studio UI with professor selection, voice/video/text mode switching, browser TTS playback, active session status, and session history.
- Added events calendar for community meetings, workshops, office hours, RSVP, attendance tracking, and replay-ready event metadata.
- Added replay library combining class and event replays with transcripts and multilingual metadata.
- Added dashboard quick links to Programs, Events, Replays, Documents, and Voice Studio.

## Phase 2 Validation — 2026-06-05
- Backend Phase 2 regression tests passed 7/7: `/app/backend/tests/test_phase2_semester_ecosystem.py`.
- Voice persistence regression tests passed 4/4: `/app/backend/tests/test_voice_session_contracts.py`.
- Frontend tests validated programs, assignments, documents upload/export/download listing, events RSVP/attendance persistence, replay library, Voice Studio, dashboard quick links, and mobile overflow.
- Reports: `/app/test_reports/iteration_4.json`, `/app/test_reports/iteration_5.json`.

## Credential-Gated Notes
- Direct OpenAI Realtime Voice credentials were not provided. The platform now has production-ready voice/video session architecture and browser TTS/text AI operation; real-time OpenAI voice can be activated once a direct OpenAI Realtime-enabled API key is configured.
- Avatar provider integration is provider-ready for future HeyGen/Synthesia/D-ID/Tavus-style systems without rebuilding the classroom/session architecture.


## Bug Fix — First-Time Dashboard Welcome — 2026-06-05
- Fixed onboarding-to-dashboard first-session logic so brand-new users see "Welcome to ClearPath, [Name]" instead of "Welcome back" after completing onboarding.
- Added durable user state flags: `has_completed_onboarding`, `has_completed_first_login`, `has_visited_dashboard`, and `dashboard_visit_count`.
- `/api/dashboard` now returns `is_first_session` and `first_visit_experience` containing welcome message, roadmap summary, recommended first course, assigned AI Professor, and next steps.
- Added `/api/dashboard/mark-visited` so the frontend marks first dashboard visit only after the first-visit experience renders.
- Made onboarding idempotent so returning users cannot be downgraded back to first-session by re-submitting onboarding.
- Normalized seeded returning test accounts so they correctly show "Welcome back".
- Regression passed: `/app/test_reports/iteration_7.json` and `/app/test_reports/pytest/pytest_results_iteration_7.xml`.


## Feature Addition — Primary Recovery Focus Assessment — 2026-06-05
- Added required first onboarding step: “What are you currently seeking help with?” before stage, goals, preferences, or pathway questions.
- Supports multiple selections across Alcohol, Opioids, Fentanyl, Prescription Opioids, Heroin, Stimulants, Methamphetamine, Cocaine, Crack Cocaine, Cannabis, Benzodiazepines, Nicotine/Tobacco, Gambling, Gaming, Pornography/Sexual Behavior, Food and Eating Behaviors, Multiple Substances, Supporting a Loved One, Mental Wellness Only, and Other.
- Added exact second onboarding step: “What best describes your current stage?” with Actively using, Thinking about change, Preparing to quit, Early recovery, Maintaining recovery, Returning after relapse, Supporting a loved one.
- Backend now requires `primary_recovery_focus` and validates all focus/stage options; invalid or empty focus returns 422.
- Stored recovery focus in assessment/profile and AI memory; used it to personalize roadmap, learning plan, dashboard recommendations, recommended first course, assigned AI professor, resource recommendations, community recommendations, assignments, reflections, relapse prevention planning, and AI Professor prompt context.
- Added first-visit focus-specific personalization panel on dashboard.
- Regression passed: `/app/test_reports/iteration_9.json` and `/app/test_reports/pytest/pytest_results_iteration_9_focus.xml`.
