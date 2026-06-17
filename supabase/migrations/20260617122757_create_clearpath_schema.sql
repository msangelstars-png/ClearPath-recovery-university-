
/*
# ClearPath Recovery University — Full Platform Schema

1. New Tables
- profiles: Extended user profile (display_name, role, plan, onboarding status)
- onboarding_data: Onboarding answers and generated 4-week roadmap JSON
- school_enrollments: Tracks which schools a user has enrolled in
- course_enrollments: Course progress per user (progress %, completed lessons)
- certificates: Issued completion certificates
- checkins: Daily mood/energy/sobriety check-ins
- journal_entries: Private journal entries
- ai_messages: AI professor conversation history
- support_tickets: Student support tickets with admin responses
- event_rsvps: Event RSVP and attendance records
- learning_plans: Personalized learning pathway plans
- voice_sessions: Voice/video AI session records
- class_attendances: Live class attendance tracking
- class_questions: Questions asked during live classes
- assignment_submissions: Program assignment submissions
- provider_clients: Provider-to-client relationship table

2. Security
- RLS enabled on every table
- All multi-user tables use owner-scoped policies with DEFAULT auth.uid()
- Admin and provider read-only policies where appropriate

3. Trigger
- handle_new_user() auto-creates profile on auth.users INSERT
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  role text NOT NULL DEFAULT 'student',
  plan text NOT NULL DEFAULT 'free',
  trial_ends_at timestamptz,
  onboarding_complete boolean NOT NULL DEFAULT false,
  language text DEFAULT 'en',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "admin_select_profiles" ON profiles;
CREATE POLICY "admin_select_profiles" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "provider_select_client_profiles" ON profiles;
CREATE POLICY "provider_select_client_profiles" ON profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM provider_clients pc WHERE pc.provider_user_id = auth.uid() AND pc.client_user_id = profiles.id));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TABLE IF NOT EXISTS onboarding_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  recovery_stage text, goals text[], learning_style text, support_needs text[], roadmap jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), UNIQUE(user_id)
);
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_onboarding" ON onboarding_data;
CREATE POLICY "select_own_onboarding" ON onboarding_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_onboarding" ON onboarding_data;
CREATE POLICY "insert_own_onboarding" ON onboarding_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_onboarding" ON onboarding_data;
CREATE POLICY "update_own_onboarding" ON onboarding_data FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_onboarding" ON onboarding_data;
CREATE POLICY "delete_own_onboarding" ON onboarding_data FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS school_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id text NOT NULL, enrolled_at timestamptz DEFAULT now(), UNIQUE(user_id, school_id)
);
ALTER TABLE school_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_school_enrollments" ON school_enrollments;
CREATE POLICY "select_own_school_enrollments" ON school_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_school_enrollments" ON school_enrollments;
CREATE POLICY "insert_own_school_enrollments" ON school_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_school_enrollments" ON school_enrollments;
CREATE POLICY "update_own_school_enrollments" ON school_enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_school_enrollments" ON school_enrollments;
CREATE POLICY "delete_own_school_enrollments" ON school_enrollments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id text NOT NULL, progress integer NOT NULL DEFAULT 0, completed_lessons text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'in_progress', enrolled_at timestamptz DEFAULT now(), completed_at timestamptz,
  UNIQUE(user_id, course_id)
);
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_course_enrollments" ON course_enrollments;
CREATE POLICY "select_own_course_enrollments" ON course_enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_course_enrollments" ON course_enrollments;
CREATE POLICY "insert_own_course_enrollments" ON course_enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_course_enrollments" ON course_enrollments;
CREATE POLICY "update_own_course_enrollments" ON course_enrollments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_course_enrollments" ON course_enrollments;
CREATE POLICY "delete_own_course_enrollments" ON course_enrollments FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "provider_select_client_enrollments" ON course_enrollments;
CREATE POLICY "provider_select_client_enrollments" ON course_enrollments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM provider_clients pc WHERE pc.provider_user_id = auth.uid() AND pc.client_user_id = course_enrollments.user_id));
DROP POLICY IF EXISTS "admin_select_course_enrollments" ON course_enrollments;
CREATE POLICY "admin_select_course_enrollments" ON course_enrollments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id text NOT NULL, course_title text, issued_at timestamptz DEFAULT now(), UNIQUE(user_id, course_id)
);
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_certificates" ON certificates;
CREATE POLICY "select_own_certificates" ON certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_certificates" ON certificates;
CREATE POLICY "insert_own_certificates" ON certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_certificates" ON certificates;
CREATE POLICY "update_own_certificates" ON certificates FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_certificates" ON certificates;
CREATE POLICY "delete_own_certificates" ON certificates FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "provider_select_client_certificates" ON certificates;
CREATE POLICY "provider_select_client_certificates" ON certificates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM provider_clients pc WHERE pc.provider_user_id = auth.uid() AND pc.client_user_id = certificates.user_id));
DROP POLICY IF EXISTS "admin_select_certificates" ON certificates;
CREATE POLICY "admin_select_certificates" ON certificates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mood integer NOT NULL DEFAULT 5, energy integer NOT NULL DEFAULT 5, sober boolean NOT NULL DEFAULT true,
  gratitude text, intention text, created_at timestamptz DEFAULT now()
);
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_checkins" ON checkins;
CREATE POLICY "select_own_checkins" ON checkins FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_checkins" ON checkins;
CREATE POLICY "insert_own_checkins" ON checkins FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_checkins" ON checkins;
CREATE POLICY "update_own_checkins" ON checkins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_checkins" ON checkins;
CREATE POLICY "delete_own_checkins" ON checkins FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "provider_select_client_checkins" ON checkins;
CREATE POLICY "provider_select_client_checkins" ON checkins FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM provider_clients pc WHERE pc.provider_user_id = auth.uid() AND pc.client_user_id = checkins.user_id));
DROP POLICY IF EXISTS "admin_select_checkins" ON checkins;
CREATE POLICY "admin_select_checkins" ON checkins FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text, content text NOT NULL, mood integer, tags text[] DEFAULT '{}', created_at timestamptz DEFAULT now()
);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_journal" ON journal_entries;
CREATE POLICY "select_own_journal" ON journal_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_journal" ON journal_entries;
CREATE POLICY "insert_own_journal" ON journal_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_journal" ON journal_entries;
CREATE POLICY "update_own_journal" ON journal_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_journal" ON journal_entries;
CREATE POLICY "delete_own_journal" ON journal_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "provider_select_client_journal_count" ON journal_entries;
CREATE POLICY "provider_select_client_journal_count" ON journal_entries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM provider_clients pc WHERE pc.provider_user_id = auth.uid() AND pc.client_user_id = journal_entries.user_id));

CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  professor_id text NOT NULL, role text NOT NULL CHECK (role IN ('user', 'assistant')), content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_ai_messages" ON ai_messages;
CREATE POLICY "select_own_ai_messages" ON ai_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_ai_messages" ON ai_messages;
CREATE POLICY "insert_own_ai_messages" ON ai_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_ai_messages" ON ai_messages;
CREATE POLICY "update_own_ai_messages" ON ai_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_ai_messages" ON ai_messages;
CREATE POLICY "delete_own_ai_messages" ON ai_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "admin_select_ai_messages" ON ai_messages;
CREATE POLICY "admin_select_ai_messages" ON ai_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL, category text NOT NULL DEFAULT 'Other', message text NOT NULL,
  response text, status text NOT NULL DEFAULT 'open', resolved_at timestamptz, created_at timestamptz DEFAULT now()
);
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_tickets" ON support_tickets;
CREATE POLICY "select_own_tickets" ON support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_tickets" ON support_tickets;
CREATE POLICY "insert_own_tickets" ON support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_tickets" ON support_tickets;
CREATE POLICY "update_own_tickets" ON support_tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_tickets" ON support_tickets;
CREATE POLICY "delete_own_tickets" ON support_tickets FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "admin_select_tickets" ON support_tickets;
CREATE POLICY "admin_select_tickets" ON support_tickets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
DROP POLICY IF EXISTS "admin_update_tickets" ON support_tickets;
CREATE POLICY "admin_update_tickets" ON support_tickets FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE TABLE IF NOT EXISTS event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id text NOT NULL, status text NOT NULL DEFAULT 'going', attended boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(), UNIQUE(user_id, event_id)
);
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_rsvps" ON event_rsvps;
CREATE POLICY "select_own_rsvps" ON event_rsvps FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_rsvps" ON event_rsvps;
CREATE POLICY "insert_own_rsvps" ON event_rsvps FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_rsvps" ON event_rsvps;
CREATE POLICY "update_own_rsvps" ON event_rsvps FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_rsvps" ON event_rsvps;
CREATE POLICY "delete_own_rsvps" ON event_rsvps FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS learning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  pathway_id text NOT NULL, status text NOT NULL DEFAULT 'active', started_at timestamptz DEFAULT now(),
  UNIQUE(user_id, pathway_id)
);
ALTER TABLE learning_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_plans" ON learning_plans;
CREATE POLICY "select_own_plans" ON learning_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_plans" ON learning_plans;
CREATE POLICY "insert_own_plans" ON learning_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_plans" ON learning_plans;
CREATE POLICY "update_own_plans" ON learning_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_plans" ON learning_plans;
CREATE POLICY "delete_own_plans" ON learning_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  professor_id text NOT NULL, mode text NOT NULL DEFAULT 'voice', language text NOT NULL DEFAULT 'en',
  status text NOT NULL DEFAULT 'active', voice_profile text DEFAULT 'natural', webrtc_ready boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_voice_sessions" ON voice_sessions;
CREATE POLICY "select_own_voice_sessions" ON voice_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_voice_sessions" ON voice_sessions;
CREATE POLICY "insert_own_voice_sessions" ON voice_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_voice_sessions" ON voice_sessions;
CREATE POLICY "update_own_voice_sessions" ON voice_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_voice_sessions" ON voice_sessions;
CREATE POLICY "delete_own_voice_sessions" ON voice_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS class_attendances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id text NOT NULL, joined_at timestamptz DEFAULT now(), UNIQUE(user_id, class_id)
);
ALTER TABLE class_attendances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_attendances" ON class_attendances;
CREATE POLICY "select_own_attendances" ON class_attendances FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_attendances" ON class_attendances;
CREATE POLICY "insert_own_attendances" ON class_attendances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_attendances" ON class_attendances;
CREATE POLICY "update_own_attendances" ON class_attendances FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_attendances" ON class_attendances;
CREATE POLICY "delete_own_attendances" ON class_attendances FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS class_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id text NOT NULL, question text NOT NULL, asked_at timestamptz DEFAULT now()
);
ALTER TABLE class_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_questions" ON class_questions;
CREATE POLICY "select_own_questions" ON class_questions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_questions" ON class_questions;
CREATE POLICY "insert_own_questions" ON class_questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_questions" ON class_questions;
CREATE POLICY "update_own_questions" ON class_questions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_questions" ON class_questions;
CREATE POLICY "delete_own_questions" ON class_questions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  assignment_id text NOT NULL, program_id text NOT NULL, response text NOT NULL,
  submitted_at timestamptz DEFAULT now(), UNIQUE(user_id, assignment_id)
);
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_submissions" ON assignment_submissions;
CREATE POLICY "select_own_submissions" ON assignment_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_submissions" ON assignment_submissions;
CREATE POLICY "insert_own_submissions" ON assignment_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_submissions" ON assignment_submissions;
CREATE POLICY "update_own_submissions" ON assignment_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_submissions" ON assignment_submissions;
CREATE POLICY "delete_own_submissions" ON assignment_submissions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS provider_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active', added_at timestamptz DEFAULT now(),
  UNIQUE(provider_user_id, client_user_id)
);
ALTER TABLE provider_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "provider_select_own_clients" ON provider_clients;
CREATE POLICY "provider_select_own_clients" ON provider_clients FOR SELECT TO authenticated USING (auth.uid() = provider_user_id);
DROP POLICY IF EXISTS "provider_insert_own_clients" ON provider_clients;
CREATE POLICY "provider_insert_own_clients" ON provider_clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_user_id);
DROP POLICY IF EXISTS "provider_update_own_clients" ON provider_clients;
CREATE POLICY "provider_update_own_clients" ON provider_clients FOR UPDATE TO authenticated USING (auth.uid() = provider_user_id) WITH CHECK (auth.uid() = provider_user_id);
DROP POLICY IF EXISTS "provider_delete_own_clients" ON provider_clients;
CREATE POLICY "provider_delete_own_clients" ON provider_clients FOR DELETE TO authenticated USING (auth.uid() = provider_user_id);
DROP POLICY IF EXISTS "admin_select_provider_clients" ON provider_clients;
CREATE POLICY "admin_select_provider_clients" ON provider_clients FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_provider_clients_provider ON provider_clients(provider_user_id);
CREATE INDEX IF NOT EXISTS idx_provider_clients_client ON provider_clients(client_user_id);
