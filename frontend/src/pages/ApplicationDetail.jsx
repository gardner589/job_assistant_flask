import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationsApi } from '../api.js';

function scoreClass(s) {
  if (s >= 70) return 'score-high';
  if (s >= 40) return 'score-medium';
  return 'score-low';
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString() : '';
}

export default function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('resume');

  const [editResume, setEditResume] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editStatus, setEditStatus] = useState('pending');
  const [editAppliedAt, setEditAppliedAt] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    applicationsApi.getOne(id).then(({ data }) => {
      setApp(data);
      setEditResume(data.tailored_resume || '');
      setEditCover(data.cover_letter || '');
      setEditStatus(data.status || 'pending');
      setEditNotes(data.notes || '');
      setEditAppliedAt(data.applied_at ? data.applied_at.split('T')[0] : '');
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function save() {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const { data } = await applicationsApi.update(id, {
        status: editStatus,
        notes: editNotes,
        applied_at: editAppliedAt || null,
        tailored_resume: editResume,
        cover_letter: editCover,
      });
      setApp(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty-state"><div className="spinner" /></div>;
  if (!app) return <div className="empty-state card"><p>Application not found.</p><Link to="/applications" className="btn btn-secondary mt-2">← Back</Link></div>;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <div className="text-muted text-sm mb-1">
            <Link to="/applications" style={{ color: 'var(--text-muted)' }}>Applications</Link> / {app.job_posting?.company}
          </div>
          <h1>{app.job_posting?.title || 'Untitled Role'}</h1>
          <div className="flex gap-1 mt-1" style={{ alignItems: 'center' }}>
            <span className={`badge badge-${app.status}`}>{app.status}</span>
            <span className="text-muted text-sm">{app.job_posting?.company}</span>
            {app.applied_at && <span className="text-muted text-sm">· Applied {fmt(app.applied_at)}</span>}
          </div>
        </div>
        <div className="score-ring">
          <div className={`score-circle ${scoreClass(app.alignment_score)}`}>{app.alignment_score}</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Match %</div>
        </div>
      </div>

      <div className="grid-2 mb-2" style={{ alignItems: 'start' }}>
        {/* AI content */}
        <div className="card">
          <div className="tabs">
            <button className={`tab ${tab === 'resume' ? 'active' : ''}`} onClick={() => setTab('resume')}>Tailored Resume</button>
            <button className={`tab ${tab === 'cover' ? 'active' : ''}`} onClick={() => setTab('cover')}>Cover Letter</button>
            <button className={`tab ${tab === 'analysis' ? 'active' : ''}`} onClick={() => setTab('analysis')}>Analysis</button>
          </div>
          {tab === 'resume' && (
            <textarea rows={22} value={editResume} onChange={e => setEditResume(e.target.value)}
              style={{ fontFamily: 'monospace', fontSize: '0.82rem' }} />
          )}
          {tab === 'cover' && (
            <textarea rows={22} value={editCover} onChange={e => setEditCover(e.target.value)} />
          )}
          {tab === 'analysis' && (
            <>
              <p className="text-sm mb-2" style={{ lineHeight: 1.6 }}>{app.alignment_summary}</p>
              <hr className="divider" />
              <div className="mb-2">
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Missing Keywords</div>
                {!app.missing_keywords?.length
                  ? <p className="text-muted text-sm">None detected — great coverage!</p>
                  : app.missing_keywords.map(kw => <span key={kw} className="chip chip-missing">{kw}</span>)
                }
              </div>
              <hr className="divider" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Strengths</div>
                <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', lineHeight: 1.8 }}>
                  {app.strengths?.map(s => <li key={s}>{s}</li>)}
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Tracking panel */}
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Application Tracking</h3>
          <div className="form-group">
            <label>Status</label>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)}>
              {['pending', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Applied Date</label>
            <input type="date" value={editAppliedAt} onChange={e => setEditAppliedAt(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={6} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Interview notes, follow-up dates, contacts..." />
          </div>
          {saveError && <div className="alert alert-error">{saveError}</div>}
          {saveSuccess && <div className="alert alert-success">Changes saved.</div>}
          <button className="btn btn-primary" disabled={saving} onClick={save} style={{ width: '100%', justifyContent: 'center' }}>
            {saving && <span className="spinner" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <hr className="divider" />
          <div className="text-muted text-sm">
            <div>Resume: <strong>{app.resume?.name}</strong></div>
            {app.job_posting?.url && (
              <div className="mt-1">
                <a href={app.job_posting.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                  View original posting ↗
                </a>
              </div>
            )}
            <div className="mt-1">Created {fmt(app.created_at)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
