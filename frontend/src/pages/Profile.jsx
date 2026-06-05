import { useEffect, useState } from "react";
import { Camera, Check, Globe, Shield, Upload, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageShell } from "@/components/Layout";
import UserAvatar from "@/components/UserAvatar";
import { platformApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const visibilityOptions = [
  ["public", "Public profile"],
  ["community", "Community-only profile"],
  ["private", "Private profile"],
];

export default function Profile() {
  const { user, setUser } = useAuth();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ name: "", preferred_name: "", language_preference: "en", bio: "", time_zone: "UTC", profile_visibility: "private", goals: "" });
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState("");
  const load = async () => {
    const { data } = await platformApi.profile();
    setData(data);
    setForm({ name: data.user.name || "", preferred_name: data.user.preferred_name || "", language_preference: data.user.language_preference || "en", bio: data.user.bio || "", time_zone: data.user.time_zone || "UTC", profile_visibility: data.user.profile_visibility || "private", goals: (data.profile?.goals || []).join(", ") });
  };
  useEffect(() => { load(); }, []);
  const saveProfile = async () => {
    const { data } = await platformApi.updateProfile({ ...form, goals: form.goals.split(",").map((item) => item.trim()).filter(Boolean) });
    setUser(data.user);
    localStorage.setItem("clearpath_user", JSON.stringify(data.user));
    setMessage("Profile updated.");
    load();
  };
  const uploadPhoto = async () => {
    if (!photo) return;
    const body = new FormData();
    body.append("file", photo);
    const { data } = await platformApi.uploadProfilePhoto(body);
    setUser(data.user);
    localStorage.setItem("clearpath_user", JSON.stringify(data.user));
    setMessage("Profile photo updated.");
    setPhoto(null);
    load();
  };
  const chooseAvatar = async (avatar) => {
    const { data } = await platformApi.selectAvatar({ avatar_id: avatar.id, avatar_type: "default", avatar_style: avatar.style });
    setUser(data.user);
    localStorage.setItem("clearpath_user", JSON.stringify(data.user));
    setMessage(`${avatar.name} avatar selected.`);
    load();
  };
  const useInitials = async () => {
    const { data } = await platformApi.selectAvatar({ avatar_type: "initials", avatar_style: "initials" });
    setUser(data.user);
    localStorage.setItem("clearpath_user", JSON.stringify(data.user));
    setMessage("Initials avatar selected.");
    load();
  };
  if (!data) return <PageShell title="My Profile"><div data-testid="profile-loading-state">Loading profile…</div></PageShell>;
  return (
    <PageShell eyebrow="Account identity" title="My Profile">
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success" data-testid="profile-success-message">{message}</div>}
      <div className="grid gap-6 lg:grid-cols-3" data-testid="profile-grid">
        <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="profile-summary-card">
          <UserAvatar user={data.user} size="xl" testId="profile-main-avatar" />
          <h2 className="mt-5 font-heading text-3xl text-brand-dark" data-testid="profile-display-name">{data.user.display_name}</h2>
          <p className="mt-1 text-sm text-brand-muted" data-testid="profile-email-display">{data.user.email}</p>
          <div className="mt-5 space-y-2 text-sm text-brand-charcoal"><p data-testid="profile-focus-display"><Shield className="mr-2 inline text-brand-primary" size={16} />{(data.profile?.primary_recovery_focus || []).join(", ") || "Recovery focus not set"}</p><p data-testid="profile-stage-display"><User className="mr-2 inline text-brand-primary" size={16} />{data.profile?.recovery_stage || "Stage not set"}</p><p data-testid="profile-language-display"><Globe className="mr-2 inline text-brand-primary" size={16} />{data.user.language_preference}</p></div>
        </section>
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-2" data-testid="profile-edit-card">
          <h2 className="font-heading text-2xl text-brand-dark">Profile information</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="profile-name-input" placeholder="Name" /><Input value={form.preferred_name} onChange={(e) => setForm({ ...form, preferred_name: e.target.value })} data-testid="profile-preferred-name-input" placeholder="Preferred name" /><Input value={form.language_preference} onChange={(e) => setForm({ ...form, language_preference: e.target.value })} data-testid="profile-language-input" placeholder="Language preference" /><Input value={form.time_zone} onChange={(e) => setForm({ ...form, time_zone: e.target.value })} data-testid="profile-time-zone-input" placeholder="Time zone" /></div>
          <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} data-testid="profile-bio-input" className="mt-4 rounded-xl border-brand-border" placeholder="Bio / About me" />
          <Input value={form.goals} onChange={(e) => setForm({ ...form, goals: e.target.value })} data-testid="profile-goals-input" className="mt-4 rounded-xl border-brand-border" placeholder="Goals, separated by commas" />
          <h3 className="mt-6 font-heading text-xl text-brand-dark">Privacy controls</h3>
          <div className="mt-3 flex flex-wrap gap-2">{visibilityOptions.map(([value, label]) => <button key={value} onClick={() => setForm({ ...form, profile_visibility: value })} data-testid={`profile-visibility-${value}`} className={`rounded-full border px-4 py-2 text-sm ${form.profile_visibility === value ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white text-brand-charcoal"}`}>{form.profile_visibility === value && <Check className="mr-1 inline" size={14} />}{label}</button>)}</div>
          <Button onClick={saveProfile} data-testid="profile-save-button" className="mt-6 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Save profile</Button>
        </section>
      </div>
      <section className="mt-6 rounded-2xl border border-brand-border bg-white p-6" data-testid="profile-avatar-card">
        <h2 className="font-heading text-2xl text-brand-dark">Profile picture and avatars</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3"><div className="rounded-xl bg-brand-card p-4" data-testid="profile-photo-upload-box"><Camera className="mb-3 text-brand-primary" /><h3 className="font-heading text-xl text-brand-dark">Upload personal photo</h3><Input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0])} data-testid="profile-photo-input" className="mt-3" /><Button onClick={uploadPhoto} disabled={!photo} data-testid="profile-photo-upload-button" className="mt-3 rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><Upload size={16} /> Upload photo</Button></div><button onClick={useInitials} data-testid="profile-avatar-initials" className="rounded-xl border border-brand-border bg-white p-4 text-left hover:bg-brand-card"><div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary font-heading text-xl text-white">{user?.initials || "CP"}</div><h3 className="font-heading text-xl text-brand-dark">Initials fallback</h3><p className="text-sm text-brand-muted">Simple privacy-friendly avatar.</p></button>{data.default_avatars.map((avatar) => <button key={avatar.id} onClick={() => chooseAvatar(avatar)} data-testid={`profile-avatar-${avatar.id}`} className="rounded-xl border border-brand-border bg-white p-4 text-left hover:bg-brand-card"><img src={avatar.url} alt={avatar.name} className="mb-3 h-20 w-20 rounded-full object-cover" /><h3 className="font-heading text-xl text-brand-dark">{avatar.name}</h3><p className="text-sm text-brand-muted">{avatar.style}</p></button>)}</div>
      </section>
    </PageShell>
  );
}