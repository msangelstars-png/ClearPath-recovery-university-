import { useEffect, useState } from "react";
import { Mic, MonitorPlay, PauseCircle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/Layout";
import { platformApi } from "@/services/api";

export default function VoiceStudio() {
  const [professors, setProfessors] = useState([]);
  const [active, setActive] = useState(null);
  const [session, setSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [mode, setMode] = useState("voice");
  const loadSessions = async () => setSessions((await platformApi.voiceSessions()).data.sessions);
  useEffect(() => { platformApi.voiceProfessors().then(({ data }) => { setProfessors(data.professors); setActive(data.professors[0]); }); loadSessions(); }, []);
  const start = async () => { if (!active) return; const { data } = await platformApi.voiceSession({ professor_id: active.id, mode, language: "en" }); setSession(data.session); loadSessions(); };
  const speak = () => {
    if (!active || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(`${active.name} here. I remember your progress and I am ready to continue your learning journey in ${mode} mode.`);
    window.speechSynthesis.speak(utterance);
  };
  return (
    <PageShell eyebrow="Voice and video professor architecture" title="Provider-ready AI professor studio">
      <div className="grid gap-6 lg:grid-cols-4" data-testid="voice-studio-grid">
        <aside className="rounded-2xl border border-brand-border bg-white p-4" data-testid="voice-professor-list">{professors.map((professor) => <button key={professor.id} onClick={() => setActive(professor)} data-testid={`voice-professor-${professor.id}`} className={`mb-3 w-full rounded-xl border p-4 text-left ${active?.id === professor.id ? "border-brand-primary bg-brand-card" : "border-brand-border"}`}><p className="font-heading text-lg text-brand-dark">{professor.avatar} {professor.name}</p><p className="text-xs text-brand-muted">{professor.voice} · realtime ready</p></button>)}</aside>
        <section className="rounded-2xl border border-brand-border bg-white p-6 lg:col-span-3" data-testid="voice-video-stage">
          <div className="aspect-video rounded-2xl bg-brand-dark p-8 text-white" data-testid="avatar-video-stage"><MonitorPlay className="mb-4" /><h2 className="font-heading text-4xl" data-testid="avatar-professor-name">{active?.avatar} {active?.name}</h2><p className="mt-3 text-white/80" data-testid="avatar-professor-style">{active?.personality} · {active?.teaching_style}</p><p className="mt-6 rounded-xl bg-white/10 p-4" data-testid="provider-ready-note">OpenAI Realtime Voice and future avatar providers can activate here when credentials are added. Text AI and browser speech playback are available now.</p></div>
          <div className="mt-5 flex flex-wrap gap-3"><Button onClick={() => setMode("voice")} data-testid="voice-mode-button" variant={mode === "voice" ? "default" : "outline"} className="rounded-full"><Mic size={16} /> Voice</Button><Button onClick={() => setMode("video")} data-testid="video-mode-button" variant={mode === "video" ? "default" : "outline"} className="rounded-full"><MonitorPlay size={16} /> Video</Button><Button onClick={() => setMode("text")} data-testid="text-mode-button" variant={mode === "text" ? "default" : "outline"} className="rounded-full">Text</Button><Button onClick={start} data-testid="start-voice-session-button" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover"><Volume2 size={16} /> Start session</Button><Button onClick={speak} data-testid="tts-playback-button" variant="outline" className="rounded-full border-brand-border bg-white"><PauseCircle size={16} /> TTS playback</Button></div>
          {session && <div className="mt-5 rounded-xl bg-brand-card p-4 text-brand-charcoal" data-testid="voice-session-status">Session active: {session.status}. Voice profile: {session.voice_profile}. WebRTC ready: {String(session.webrtc_ready)}.</div>}
          <section className="mt-5 rounded-xl bg-brand-card p-4" data-testid="voice-session-history"><h3 className="font-heading text-xl text-brand-dark">Session history</h3><div className="mt-3 space-y-2">{sessions.map((item) => <div key={item.id} className="rounded-lg bg-white p-3 text-sm text-brand-charcoal" data-testid={`voice-session-row-${item.id}`}>{item.mode} with {item.professor_id} · {item.status}</div>)}</div></section>
        </section>
      </div>
    </PageShell>
  );
}