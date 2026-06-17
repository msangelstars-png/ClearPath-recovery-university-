import { useEffect, useState } from 'react';
import { Camera, Check, Globe, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PROFESSORS } from '@/data/platform';
import UserAvatar from '@/components/UserAvatar';

const AVATAR_EMOJIS = ['🎓', '🌱', '🧠', '✨', '🤝', '💙', '💰', '🎯', '💪', '🦋', '🗣️', '🌟', '🔥', '🌈', '🌻', '⭐', '🌊', '🦊', '🦁', '🐾'];

const languageOptions = [
  ['en', 'English'],
  ['es', 'Spanish'],
  ['fr', 'French'],
  ['pt', 'Portuguese'],
];

export default function Profile() {
  const { currentUser, refreshProfile } = useAuth();
  const [onboarding, setOnboarding] = useState(null);
  const [form, setForm] = useState({
    display_name: '',
    language: 'en',
    avatar_emoji: '🎓',
    assigned_professor: '',
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setForm({
      display_name: currentUser.display_name || '',
      language: currentUser.language || 'en',
      avatar_emoji: currentUser.avatar_emoji || '🎓',
      assigned_professor: currentUser.assigned_professor || '',
    });
    supabase.from('onboarding_data').select('*').eq('user_id', currentUser.id).maybeSingle()
      .then(({ data }) => setOnboarding(data));
  }, [currentUser]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      display_name: form.display_name.trim(),
      language: form.language,
      avatar_emoji: form.avatar_emoji,
      assigned_professor: form.assigned_professor || null,
      updated_at: new Date().toISOString(),
    }).eq('id', currentUser.id);

    if (error) { setMessage('Profile could not be saved.'); }
    else { await refreshProfile(); setMessage('Profile updated.'); }
    setSaving(false);
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${currentUser.id}/avatar.${ext}`;
    const { error: err } = await supabase.storage.from('student-documents').upload(path, file, { upsert: true });
    if (err) { setMessage('Avatar upload failed.'); setUploading(false); return; }
    const { data } = supabase.storage.from('student-documents').getPublicUrl(path);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl, updated_at: new Date().toISOString() }).eq('id', currentUser.id);
    await refreshProfile();
    setMessage('Avatar updated.');
    setUploading(false);
  };

  const assignedProfessor = PROFESSORS.find((p) => p.id === form.assigned_professor);

  return (
    <PageShell eyebrow="Account identity" title="My Profile">
      {message && (
        <div className={`mb-6 rounded-2xl border border-brand-border bg-white p-4 ${message.includes('could not') || message.includes('failed') ? 'text-brand-error' : 'text-brand-success'}`}>
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-brand-border bg-white p-6">
          <div className="relative mx-auto w-fit">
            <UserAvatar user={currentUser} size="xl" />
            <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-brand-primary text-white shadow-md hover:bg-brand-primaryHover">
              <Camera size={14} />
              <input type="file" className="hidden" onChange={uploadAvatar} accept="image/*" />
            </label>
          </div>
          <h2 className="mt-5 text-center font-heading text-3xl text-brand-dark">{currentUser?.display_name}</h2>
          <p className="mt-1 text-center text-sm text-brand-muted">{currentUser?.email}</p>
          <div className="mt-5 space-y-2 text-sm text-brand-charcoal">
            <p><Shield className="mr-2 inline text-brand-primary" size={16} />{onboarding?.recovery_stage || 'Stage not set'}</p>
            <p><User className="mr-2 inline text-brand-primary" size={16} />{onboarding?.goals?.join(', ') || 'Goals not set'}</p>
            <p><Globe className="mr-2 inline text-brand-primary" size={16} />{languageOptions.find(([c]) => c === currentUser?.language)?.[1] || 'English'}</p>
          </div>
          <div className="mt-5 rounded-xl bg-brand-card p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Subscription</p>
            <p className="mt-1 font-heading text-lg text-brand-dark capitalize">{currentUser?.plan || 'free'}</p>
            {currentUser?.trial_ends_at && new Date(currentUser.trial_ends_at) > new Date() && (
              <p className="mt-1 text-xs text-brand-success">Premium trial until {new Date(currentUser.trial_ends_at).toLocaleDateString()}</p>
            )}
          </div>
          {assignedProfessor && (
            <div className="mt-3 rounded-xl bg-brand-card p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">Your professor</p>
              <p className="mt-1 font-heading text-lg text-brand-dark">{assignedProfessor.avatar} {assignedProfessor.name}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2">
          <h2 className="font-heading text-2xl text-brand-dark">Profile information</h2>

          <div className="mt-5">
            <label className="text-sm font-medium text-brand-charcoal">Display name</label>
            <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} className="mt-1 rounded-xl border-brand-border" placeholder="What should we call you?" />
          </div>

          <div className="mt-6">
            <h3 className="font-heading text-xl text-brand-dark">Avatar</h3>
            <p className="mt-1 text-sm text-brand-muted">Choose an emoji avatar or upload a photo using the camera button above.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {AVATAR_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setForm({ ...form, avatar_emoji: emoji })}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all ${form.avatar_emoji === emoji ? 'border-2 border-brand-primary bg-brand-card scale-110' : 'border border-brand-border bg-white hover:bg-brand-card'}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-heading text-xl text-brand-dark">Preferred language</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {languageOptions.map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => setForm({ ...form, language: code })}
                  className={`rounded-full border px-4 py-2 text-sm ${form.language === code ? 'border-brand-primary bg-brand-primary text-white' : 'border-brand-border bg-white text-brand-charcoal'}`}
                >
                  {form.language === code && <Check className="mr-1 inline" size={14} />}{label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-heading text-xl text-brand-dark">Assigned professor</h3>
            <p className="mt-1 text-sm text-brand-muted">Choose your primary AI mentor for personalized guidance.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {PROFESSORS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setForm({ ...form, assigned_professor: p.id })}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all ${form.assigned_professor === p.id ? 'border-brand-primary bg-brand-card' : 'border-brand-border bg-white hover:bg-brand-card'}`}
                >
                  <span className="text-xl">{p.avatar}</span>
                  <div>
                    <p className="font-medium text-brand-dark">{p.name}</p>
                    <p className="text-xs text-brand-muted">{p.focus}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={save} disabled={saving || uploading} className="mt-6 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
            <Camera size={16} /> {saving ? 'Saving...' : 'Save profile'}
          </Button>
        </section>
      </div>
    </PageShell>
  );
}
