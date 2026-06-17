import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { media } from '@/data/platform';
import UserAvatar from '@/components/UserAvatar';

export default function Certificates() {
  const { currentUser } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase
      .from('certificates')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('issued_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError('Certificates could not load.');
        else setCertificates(data || []);
      });
  }, [currentUser]);

  return (
    <PageShell eyebrow="Achievements" title="Certificates earned">
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error">{error}</div>}
      <div className="grid gap-6 md:grid-cols-2">
        {certificates.map((cert) => (
          <article key={cert.id} className="relative overflow-hidden rounded-2xl border border-brand-border bg-white p-8">
            <img
              src={media.texture}
              alt="Certificate background texture"
              className="absolute inset-0 h-full w-full object-cover opacity-10"
            />
            <div className="relative">
              <UserAvatar user={currentUser} size="lg" />
              <Award className="mb-5 mt-4 text-brand-primary" size={40} />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Certificate of completion</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-brand-dark">{cert.course_title}</h2>
              <p className="mt-4 text-brand-charcoal">Awarded to {currentUser?.display_name}</p>
              <p className="mt-2 text-sm text-brand-muted">
                Issued {new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <button
                onClick={() => window.print()}
                className="mt-5 rounded-full bg-brand-primary px-5 py-2.5 text-sm text-white hover:bg-brand-primaryHover"
              >
                Print / Save certificate
              </button>
            </div>
          </article>
        ))}
        {certificates.length === 0 && (
          <div className="rounded-2xl border border-brand-border bg-white p-8 text-center col-span-2">
            <Award className="mx-auto mb-4 text-brand-primary" size={40} />
            <p className="font-heading text-xl text-brand-dark">No certificates yet</p>
            <p className="mt-2 text-brand-muted">Complete a course to earn your first certificate.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
