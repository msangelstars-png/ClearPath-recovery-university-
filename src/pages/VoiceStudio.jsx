import { useEffect, useState } from 'react';
import { Mic, MonitorPlay, PauseCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PROFESSORS } from '@/data/platform';

export default function VoiceStudio() {
  const { currentUser } = useAuth();
  const [active, setActive] = useState(PROFESSORS[0]);
  const [sessions, setSessions] = useState([]);
  const [mode, setMode] = useState('voice');
  const [session, setSession] = useState(null);

  const loadSessions = async () => {
    const { data } = await supabase.from('voice_sessions').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false }).limit(10);
    setSessions(data || []);
  };

  useEffect(() => { loadSessions(); }, [currentUser]);

  const start = async () => {
    const { data } = await supabase.from('voice_sessions').insert({
      professor_id: active.id,
      mode,
      language: 'en',
      status: 'active',
      voice_profile: 'natural',
      webrtc_ready: false,
    }).select().maybeSingle();
    setSession(data);
    loadSessions();
  };

  const speak = () => {
    if (!active || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(
      `${active.name} here. I remember your progress and I am ready to continue your learning journey in ${mode} mode.`
    );
    window.speechSynthesis.speak(utterance);
  };

  return (
    <PageShell eyebrow="Voice and video professor architecture" title="Provider-ready AI professor studio">
      <div className="grid gap-6 lg:grid-cols-4">
        <aside className="rounded-2xl border border-brand-border bg-white p-4">
          {PROFESSORS.map((professor) => (
            <button
              key={professor.id}
              onClick={() => setActive(professor)}
              className={`mb-3 w-full rounded-xl border p-4 text-left transition-colors ${active.id === professor.id ? 'border-brand-primary bg-brand-card' : 'border-brand-border hover:bg-brand-card'}`}
            >
              <p className="font-heading text-lg text-brand-dark">{professor.avatar} {professor.name}</p>
              <p className="text-xs text-brand-muted">{professor.voice} · realtime ready</p>
            </button>
          ))}
        </aside>

        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-3">
          <div className="aspect-video rounded-2xl bg-brand-dark p-8 text-white">
            <MonitorPlay className="mb-4" />
            <h2 className="font-heading text-4xl">{active.avatar} {active.name}</h2>
            <p className="mt-3 text-white/80">{active.personality} · {active.teaching_style}</p>
            <p className="mt-6 rounded-xl bg-white/10 p-4">
              OpenAI Realtime Voice and future avatar providers can activate here when credentials are added. Text AI and browser speech playback are available now.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {['voice', 'video', 'text'].map((m) => (
              <Button
                key={m}
                onClick={() => setMode(m)}
                variant={mode === m ? 'default' : 'outline'}
                className="rounded-full capitalize"
              >
                {m === 'voice' && <Mic size={16} />}
                {m === 'video' && <MonitorPlay size={16} />}
                {m}
              </Button>
            ))}
            <Button onClick={start} className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">
              <Volume2 size={16} /> Start session
            </Button>
            <Button onClick={speak} variant="outline" className="rounded-full border-brand-border bg-white">
              <PauseCircle size={16} /> TTS playback
            </Button>
          </div>

          {session && (
            <div className="mt-5 rounded-xl bg-brand-card p-4 text-brand-charcoal">
              Session active: {session.status}. Voice profile: {session.voice_profile}. WebRTC ready: {String(session.webrtc_ready)}.
            </div>
          )}

          <section className="mt-5 rounded-xl bg-brand-card p-4">
            <h3 className="font-heading text-xl text-brand-dark">Session history</h3>
            <div className="mt-3 space-y-2">
              {sessions.length === 0 && <p className="text-sm text-brand-muted">No sessions yet.</p>}
              {sessions.map((s) => (
                <div key={s.id} className="rounded-lg bg-white p-3 text-sm text-brand-charcoal">
                  {s.mode} with {s.professor_id} · {s.status} · {new Date(s.created_at).toLocaleDateString()}
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </PageShell>
  );
}
