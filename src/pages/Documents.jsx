import { useEffect, useRef, useState } from 'react';
import { Download, File, FileArchive, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/Layout';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const BUCKET = 'student-documents';
const MAX_MB = 10;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Documents() {
  const { currentUser } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  const prefix = `${currentUser.id}/`;

  const load = async () => {
    const { data, error: err } = await supabase.storage.from(BUCKET).list(currentUser.id, { sortBy: { column: 'created_at', order: 'desc' } });
    if (err) { setError('Could not load documents.'); return; }
    setFiles(data || []);
  };

  useEffect(() => { load(); }, [currentUser]);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) { setError(`File must be under ${MAX_MB} MB.`); return; }
    setUploading(true);
    setError('');
    const path = `${prefix}${Date.now()}-${file.name}`;
    const { error: err } = await supabase.storage.from(BUCKET).upload(path, file);
    setUploading(false);
    if (err) { setError('Upload failed. Please try again.'); return; }
    setSuccess(`${file.name} uploaded successfully.`);
    load();
    if (inputRef.current) inputRef.current.value = '';
  };

  const download = async (name) => {
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(`${prefix}${name}`, 60);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const remove = async (name) => {
    setError('');
    const { error: err } = await supabase.storage.from(BUCKET).remove([`${prefix}${name}`]);
    if (err) { setError('Could not delete file.'); return; }
    setSuccess(`${name} deleted.`);
    load();
  };

  return (
    <PageShell
      eyebrow="My documents"
      title="Files and records"
      action={
        <label className="cursor-pointer">
          <input ref={inputRef} type="file" className="hidden" onChange={upload} accept=".pdf,.doc,.docx,.jpg,.png,.txt" />
          <Button asChild className="rounded-full bg-brand-primary text-white hover:bg-brand-primaryHover" disabled={uploading}>
            <span><Upload size={16} /> {uploading ? 'Uploading...' : 'Upload file'}</span>
          </Button>
        </label>
      }
    >
      {success && <div className="mb-5 rounded-2xl border border-brand-border bg-white p-4 text-brand-success">{success}</div>}
      {error && <div className="mb-5 rounded-2xl border border-brand-border bg-white p-4 text-brand-error">{error}</div>}

      <p className="mb-6 text-sm text-brand-muted">
        Upload certificates, court documents, program completion letters, or any records related to your recovery. Files are private and only visible to you. Max {MAX_MB} MB per file.
      </p>

      {files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-brand-border bg-white p-12 text-center">
          <FileArchive className="mx-auto mb-4 text-brand-primary" size={40} />
          <p className="font-heading text-xl text-brand-dark">No documents yet</p>
          <p className="mt-2 text-brand-muted">Upload your first file using the button above.</p>
          <p className="mt-1 text-xs text-brand-muted">Accepted: PDF, Word, JPG, PNG, TXT</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <div key={file.id} className="flex items-start gap-3 rounded-2xl border border-brand-border bg-white p-5">
              <File className="mt-0.5 shrink-0 text-brand-primary" size={20} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-brand-dark" title={file.name}>{file.name}</p>
                <p className="mt-0.5 text-xs text-brand-muted">{formatBytes(file.metadata?.size || 0)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => download(file.name)}
                  className="rounded-lg p-2 text-brand-muted hover:bg-brand-card hover:text-brand-primary"
                  title="Download"
                >
                  <Download size={15} />
                </button>
                <button
                  onClick={() => remove(file.name)}
                  className="rounded-lg p-2 text-brand-muted hover:bg-red-50 hover:text-brand-error"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
