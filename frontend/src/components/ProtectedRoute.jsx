import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PageShell } from "@/components/Layout";
import EnrollmentPrompt from "@/components/EnrollmentPrompt";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-brand-base text-brand-charcoal" data-testid="auth-loading-state">Opening your university…</div>;
  }
  if (!user) return <PageShell eyebrow="Enrollment required" title="Personalized learning starts here"><EnrollmentPrompt /></PageShell>;
  if (adminOnly && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}