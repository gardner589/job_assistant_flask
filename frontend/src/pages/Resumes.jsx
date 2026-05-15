import { useState, useEffect, useRef } from 'react';
import { resumesApi } from '../api.js';

function formatDate(d) {
  return new Date(d).toLocaleDateString();
}

export default function Resumes() {
  const [tab, setTab] = useState('upload');
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [uploadName, setUploadName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const [textName, setTextName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [savingText, setSavingText] = useState(false);
  const [textError, setTextError] = useState('');

  async function fetchResumes() {
    setLoading(true);
    const { data } = await resumesApi.getAll();
    setResumes(data);
    setLoading(false);
  }

  useEffect(() => { fetchResumes(); }, []);

  function onFileChange(e) {
    setSelectedFile(e.target.files[0] || null);
    setUploadError('');
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadError('');
    } else {
      setUploadError('Only PDF files are accepted.');
    }
  }

  async function submitUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError('');
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('name', uploadName || selectedFile.name.replace('.pdf', ''));
      await resumesApi.upload(fd);
      setSelectedFile(null);
      setUploadName('');
      await fetchResumes();
    } catch (e) {
      setUploadError(e.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function submitText() {
    if (!textName || !textContent) return;
    setSavingText(true);
    setTextError('');
    try {
      await resumesApi.createText({ name: textName, content: textContent });
      setTextName('');
      setTextContent('');
      await fetchResumes();
    } catch (e) {
      setTextError(e.response?.data?.error || 'Save failed');
    } finally {
      setSavingText(false);
    }
  }

  async function deleteResume(id) {
    if (!confirm('Delete this resume?')) return;
    await resumesApi.delete(id);
    await fetchResumes();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Resumes</h1>
        <p>Upload and manage your resumes</p>
      </div>

      <div className="card mb-2">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Add Resume</h2>

        <div className="tabs">
          <button className={`tab ${tab === 'upload' ? 'active' : ''}`} onClick={() => setTab('upload')}>📁 PDF Upload</button>
          <button className={`tab ${tab === 'text' ? 'active' : ''}`} onClick={() => setTab('text')}>✏️ Paste Text</button>
        </div>

        {tab === 'upload' && (
          <>
            <div className="form-group">
              <label>Resume Name</label>
              <input value={uploadName} onChange={e => setUploadName(e.target.value)} type="text" placeholder="e.g. Senior Developer Resume" />
            </div>
            <div
              className={`upload-zone ${dragging ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={onFileChange} />
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
              <p>{selectedFile ? selectedFile.name : 'Click or drag a PDF here'}</p>
              <p className="text-muted text-sm mt-1">PDF only, max 10MB</p>
            </div>
            {uploadError && <div className="alert alert-error mt-1">{uploadError}</div>}
            <button className="btn btn-primary mt-2" disabled={!selectedFile || uploading} onClick={submitUpload}>
              {uploading && <span className="spinner" />}
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </button>
          </>
        )}

        {tab === 'text' && (
          <>
            <div className="form-group">
              <label>Resume Name</label>
              <input value={textName} onChange={e => setTextName(e.target.value)} type="text" placeholder="e.g. Marketing Resume 2025" />
            </div>
            <div className="form-group">
              <label>Resume Content</label>
              <textarea rows={12} value={textContent} onChange={e => setTextContent(e.target.value)} placeholder="Paste your resume text here..." />
            </div>
            {textError && <div className="alert alert-error">{textError}</div>}
            <button className="btn btn-primary" disabled={!textName || !textContent || savingText} onClick={submitText}>
              {savingText && <span className="spinner" />}
              {savingText ? 'Saving...' : 'Save Resume'}
            </button>
          </>
        )}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Saved Resumes</h2>
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : resumes.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📄</div>
            <p>No resumes yet. Add one above.</p>
          </div>
        ) : (
          resumes.map(r => (
            <div key={r.id} className="flex-between" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{r.name}</div>
                <div className="text-muted text-sm">{r.filename || 'Text entry'} · {formatDate(r.created_at)}</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={() => deleteResume(r.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
