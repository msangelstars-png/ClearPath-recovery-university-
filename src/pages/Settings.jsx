import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Key, LogOut, Shield, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const changePassword = async () => {
    setError('');
    if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setMessage('Password updated successfully.');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <PageShell eyebrow="Account settings" title="Settings">
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success">{message}</div>}
      {error && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-error">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-brand-border bg-white p-6">
          <div className="flex items-center gap-3 mb-5">
            <Key className="text-brand-primary" size={22} />
            <h2 className="font-heading text-2xl text-brand-dark">Change password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-brand-charcoal">New password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 rounded-xl border-brand-border" placeholder="At least 6 characters" />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-charcoal">Confirm new password</label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 rounded-xl border-brand-border" placeholder="Re-enter your new password" />
            </div>
            <Button onClick={changePassword} disabled={saving} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
              <Key size={16} /> {saving ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="text-brand-primary" size={22} />
              <h2 className="font-heading text-2xl text-brand-dark">Account</h2>
            </div>
            <div className="space-y-3 text-sm text-brand-charcoal">
              <div className="flex justify-between rounded-xl bg-brand-card p-3">
                <span className="text-brand-muted">Email</span>
                <span className="font-medium">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-brand-card p-3">
                <span className="text-brand-muted">Plan</span>
                <span className="font-medium capitalize">{currentUser?.plan || 'free'}</span>
              </div>
              <div className="flex justify-between rounded-xl bg-brand-card p-3">
                <span className="text-brand-muted">Role</span>
                <span className="font-medium capitalize">{currentUser?.role || 'student'}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button asChild variant="outline" className="rounded-full border-brand-border">
                <Link to="/profile">Edit profile</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-brand-border">
                <Link to="/plans">Manage subscription</Link>
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-brand-border bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="text-brand-primary" size={22} />
              <h2 className="font-heading text-2xl text-brand-dark">Session</h2>
            </div>
            <Button onClick={logout} variant="outline" className="rounded-full border-brand-border text-brand-error hover:bg-red-50 hover:text-brand-error">
              <LogOut size={16} /> Logout
            </Button>
          </section>

          <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="text-red-600" size={22} />
              <h2 className="font-heading text-2xl text-red-700">Danger zone</h2>
            </div>
            <p className="text-sm text-red-700/80">
              Account deletion is permanent and removes all your data, progress, certificates, and journal entries. This cannot be undone.
            </p>
            <p className="mt-3 text-sm text-red-700/60">
              To delete your account, contact support at support@clearpath.university from your registered email.
            </p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
