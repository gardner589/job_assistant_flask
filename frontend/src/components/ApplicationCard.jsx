import { useNavigate } from 'react-router-dom';
import { applicationsApi } from '../api.js';

function scoreClass(s) {
  if (s == null) return '';
  if (s >= 70) return 'high';
  if (s >= 40) return 'medium';
  return 'low';
}

function fmt(d) {
  return d ? new Date(d).toLocaleDateString() : '';
}

export default function ApplicationCard({ application: app, onDeleted }) {
  const navigate = useNavigate();

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm('Delete this application?')) return;
    await applicationsApi.delete(app.id);
    onDeleted();
  }

  return (
    <div
      onClick={() => navigate(`/applications/${app.id}`)}
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '1rem 1.25rem',
        marginBottom: '0.6rem',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
          {app.job_posting?.title || 'Untitled Role'}
        </div>
        <div className="text-muted text-sm" style={{ marginTop: '0.2rem' }}>
          {app.job_posting?.company || 'Unknown Company'}
          {app.applied_at && ` · Applied ${fmt(app.applied_at)}`}
          {` · ${fmt(app.created_at)}`}
        </div>
        <div className="text-muted text-sm" style={{ marginTop: '0.2rem', fontSize: '0.8rem' }}>
          {app.resume?.name}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', border: '2px solid',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700,
          ...(scoreClass(app.alignment_score) === 'high'
            ? { borderColor: 'var(--success)', color: 'var(--success)' }
            : scoreClass(app.alignment_score) === 'medium'
            ? { borderColor: 'var(--warning)', color: 'var(--warning)' }
            : { borderColor: 'var(--danger)', color: 'var(--danger)' }),
        }}>
          {app.alignment_score ?? '?'}
        </div>
        <span className={`badge badge-${app.status}`}>{app.status}</span>
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>✕</button>
      </div>
    </div>
  );
}
