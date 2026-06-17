import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TopNav } from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { media } from '@/data/platform';

export default function Auth() {
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'register') {
        await register(form);
        // After register, profile is created via trigger; redirect to onboarding
        navigate('/onboarding');
      } else {
        await login({ email: form.email, password: form.password });
        // Load profile to check onboarding status
        const profile = await refreshProfile();
        navigate(profile?.onboarding_complete ? '/dashboard' : '/onboarding');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already registered') || msg.includes('User already registered')) {
        setError('An account with this email already exists. Please log in.');
      } else if (msg.includes('Invalid login credentials')) {
        setError('Email or password is incorrect. Please try again.');
      } else {
        setError(msg || 'We could not complete that request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-base" data-testid="auth-page">
      <TopNav />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-white">
          <img src={media.hero} alt="Sunrise over a peaceful green landscape" className="h-full min-h-[420px] w-full object-cover object-center" />
        </div>
        <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Student access</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold text-brand-dark">
            {mode === 'register' ? 'Create your ClearPath account' : 'Welcome back'}
          </h1>
          <div className="mt-6 flex rounded-full border border-brand-border bg-brand-card p-1">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${mode === 'register' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted'}`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-full px-4 py-2 text-sm transition-colors ${mode === 'login' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-muted'}`}
            >
              Login
            </button>
          </div>
          <form onSubmit={submit} className="mt-6 space-y-5">
            {mode === 'register' && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2 rounded-xl border-brand-border bg-white"
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 rounded-xl border-brand-border bg-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-2 rounded-xl border-brand-border bg-white"
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-brand-error">{error}</p>
            )}
            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-brand-primary py-6 text-white hover:bg-brand-primaryHover"
            >
              {mode === 'register' ? <UserPlus size={17} /> : <LogIn size={17} />}
              {submitting ? 'Opening…' : mode === 'register' ? 'Create account' : 'Login'}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
