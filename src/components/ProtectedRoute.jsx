import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageShell } from '@/components/Layout';
import EnrollmentPrompt from '@/components/EnrollmentPrompt';

export default function ProtectedRoute({ children, adminOnly = false, providerOnly = false }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-base text-brand-charcoal">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
          <p className="font-heading text-lg text-brand-dark">Opening your university…</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <PageShell eyebrow="Enrollment required" title="Personalized learning starts here">
        <EnrollmentPrompt />
      </PageShell>
    );
  }

  if (adminOnly && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (providerOnly && currentUser.role !== 'provider' && currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
