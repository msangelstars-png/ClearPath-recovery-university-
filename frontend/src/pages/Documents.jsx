import { useEffect, useState } from "react";
import { Download, FileArchive, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/Layout";
import { fileDownloadUrl, platformApi } from "@/services/api";

export default function Documents() {
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [purpose, setPurpose] = useState("student_document");
  const [message, setMessage] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const load = async () => setFiles((await platformApi.files()).data.files);
  useEffect(() => { load(); }, []);
  const upload = async () => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", purpose);
    await platformApi.uploadFile(form);
    setMessage("File uploaded to permanent storage and saved to your student record.");
    setFile(null);
    load();
  };
  const exportData = async () => {
    const { data } = await platformApi.exportStudentData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "clearpath-student-data.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setExportMessage("Personal data export generated for download.");
  };
  return (
    <PageShell eyebrow="Permanent document storage" title="Student documents and uploads">
      {message && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success" data-testid="document-upload-message">{message}</div>}
      {exportMessage && <div className="mb-6 rounded-2xl border border-brand-border bg-white p-4 text-brand-success" data-testid="student-export-message">{exportMessage}</div>}
      <section className="rounded-2xl border border-brand-border bg-white p-6" data-testid="document-upload-card"><Upload className="mb-3 text-brand-primary" /><h2 className="font-heading text-2xl text-brand-dark">Upload coursework, screenshots, certificates, or personal documents</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><select value={purpose} onChange={(e) => setPurpose(e.target.value)} data-testid="document-purpose-select" className="rounded-xl border border-brand-border p-3"><option value="student_document">Student document</option><option value="assignment">Assignment</option><option value="support_attachment">Support attachment</option><option value="profile_photo">Profile photo</option><option value="certificate">Certificate</option><option value="replay_recording">Replay recording</option></select><Input type="file" onChange={(e) => setFile(e.target.files?.[0])} data-testid="document-file-input" className="rounded-xl border-brand-border" /><Button onClick={upload} data-testid="document-upload-button" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Upload</Button></div></section>
      <section className="mt-6 rounded-2xl border border-brand-border bg-white p-6" data-testid="document-library-card"><FileArchive className="mb-3 text-brand-primary" /><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="font-heading text-2xl text-brand-dark">Document library</h2><Button onClick={exportData} data-testid="student-data-export-button" className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover">Export my data</Button></div><div className="mt-4 space-y-3">{files.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-brand-card p-4 sm:flex-row sm:items-center sm:justify-between" data-testid={`document-row-${item.id}`}><div><p className="font-medium text-brand-dark" data-testid={`document-name-${item.id}`}>{item.original_filename}</p><p className="text-sm text-brand-muted" data-testid={`document-purpose-${item.id}`}>{item.purpose} · encrypted · role protected</p></div><a href={fileDownloadUrl(item.id)} data-testid={`document-download-${item.id}`} className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm text-white"><Download size={15} /> Download</a></div>)}</div></section>
    </PageShell>
  );
}