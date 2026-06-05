import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Lock, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import EnrollmentPrompt from "@/components/EnrollmentPrompt";

export default function Schools() {
  const { user } = useAuth();
  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const refresh = async () => {
    try {
      setError("");
      if (user) {
        const [schoolRes, courseRes] = await Promise.all([platformApi.schools(), platformApi.courses()]);
        setSchools(schoolRes.data.schools);
        setCourses(courseRes.data.courses);
      } else {
        const { data } = await platformApi.publicPreview();
        setSchools(data.schools);
        setCourses(data.courses);
      }
    } catch {
      setError("Schools and courses could not load. Please refresh and try again.");
    }
  };
  useEffect(() => { refresh(); }, [user]);
  const enrollSchool = async (id) => { if (!user) { setError("Create your free account to continue your personalized recovery journey."); return; } try { await platformApi.enrollSchool(id); refresh(); } catch { setError("School enrollment could not be completed."); } };
  const enrollCourse = async (id) => { if (!user) { setError("Create your free account to continue your personalized recovery journey."); return; } try { await platformApi.enrollCourse(id); refresh(); } catch (err) { setError(err.response?.data?.detail || "Course enrollment could not be completed."); } };

  return (
    <PageShell eyebrow="Schools and courses" title="Choose your next learning path" action={<Button asChild data-testid="plans-link-button" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><Link to="/plans">View plans</Link></Button>}>
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error" data-testid="schools-error-message">{error}</div>}
      {!user && <div className="mb-6"><EnrollmentPrompt text="Browse schools and course previews now. Create your free account when you’re ready to enroll, save progress, and unlock full lessons." /></div>}
      <div className="grid gap-6 lg:grid-cols-4" data-testid="schools-grid">
        {schools.map((school) => (
          <article key={school.id} className="overflow-hidden rounded-2xl border border-brand-border bg-white transition-transform duration-300 hover:-translate-y-1 hover:shadow-md" data-testid={`school-card-${school.id}`}>
            <img src={school.image} alt={school.name} className="aspect-[4/3] w-full object-cover" data-testid={`school-image-${school.id}`} />
            <div className="p-5">
              <School className="mb-3 text-brand-primary" size={22} />
              <h2 className="font-heading text-xl font-medium text-brand-dark" data-testid={`school-title-${school.id}`}>{school.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted" data-testid={`school-description-${school.id}`}>{school.description}</p>
              <p className="mt-4 text-sm font-medium text-brand-charcoal" data-testid={`school-professor-${school.id}`}>{school.professor}</p>
              <Button onClick={() => enrollSchool(school.id)} disabled={school.enrolled} data-testid={`school-enroll-button-${school.id}`} className="mt-5 w-full rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">{user ? (school.enrolled ? "Enrolled" : "Enroll in school") : "Create account to enroll"}</Button>
            </div>
          </article>
        ))}
      </div>
      <section className="mt-10" data-testid="course-catalog-section">
        <h2 className="font-heading text-3xl font-semibold text-brand-dark" data-testid="course-catalog-title">Course catalog</h2>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {courses.map((course) => (
            <article key={course.id} className="rounded-2xl border border-brand-border bg-white p-6" data-testid={`course-card-${course.id}`}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge data-testid={`course-difficulty-${course.id}`} className="bg-brand-card text-brand-charcoal hover:bg-brand-card">{course.difficulty}</Badge>
                {course.premium && <Badge data-testid={`course-premium-badge-${course.id}`} className="bg-brand-primary text-white hover:bg-brand-primary">Premium</Badge>}
                {course.locked && <span data-testid={`course-locked-label-${course.id}`} className="inline-flex items-center gap-1 text-xs text-brand-muted"><Lock size={13} /> Locked</span>}
              </div>
              <h3 className="mt-4 font-heading text-2xl font-medium text-brand-dark" data-testid={`course-title-${course.id}`}>{course.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted" data-testid={`course-summary-${course.id}`}>{course.summary}</p>
              <p className="mt-4 text-sm font-medium text-brand-charcoal" data-testid={`course-instructor-${course.id}`}>{course.instructor_ai}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                {course.enrollment ? <Button asChild data-testid={`course-open-button-${course.id}`} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><Link to={`/courses/${course.id}`}><BookOpen size={16} /> Open course</Link></Button> : <Button onClick={() => enrollCourse(course.id)} disabled={user && course.locked} data-testid={`course-enroll-button-${course.id}`} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">{user ? "Enroll" : "Preview / enroll"}</Button>}
                {course.locked && <Button asChild variant="outline" data-testid={`course-upgrade-button-${course.id}`} className="rounded-full border-brand-border bg-white"><Link to="/plans">Upgrade</Link></Button>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}