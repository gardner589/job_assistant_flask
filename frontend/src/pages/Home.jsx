import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../api.js';
import ApplicationCard from '../components/ApplicationCard.jsx';

function scoreColor(s) {
  if (s >= 70) return 'var(--success)';
  if (s >= 40) return 'var(--warning)';
  return 'var(--danger)';
}

export default function Home() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    const { data } = await applicationsApi.getAll();
    setApplications(data);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const activeCount = applications.filter(a => ['applied', 'interviewing'].includes(a.status)).length;
  const scored = applications.filter(a => a.alignment_score != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, a) => s + a.alignment_score, 0) / scored.length)
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your AI-powered job application overview</p>
      </div>

      <div className="grid-3 mb-2">
        <div className="card">
          <div className="text-muted text-sm mb-1">Total Applications</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{applications.length}</div>
        </div>
        <div className="card">
          <div className="text-muted text-sm mb-1">Active (Applied / Interviewing)</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--info)' }}>{activeCount}</div>
        </div>
        <div className="card">
          <div className="text-muted text-sm mb-1">Avg. Alignment Score</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: scoreColor(avgScore) }}>
            {avgScore > 0 ? `${avgScore}%` : '—'}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-2">
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Applications</h2>
          <Link to="/analyze" className="btn btn-primary btn-sm">+ New Analysis</Link>
        </div>

        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <p>No applications yet.</p>
            <Link to="/analyze" className="btn btn-primary mt-2">Analyze your first job</Link>
          </div>
        ) : (
          <>
            {applications.slice(0, 5).map(app => (
              <ApplicationCard key={app.id} application={app} onDeleted={fetchData} />
            ))}
            {applications.length > 5 && (
              <div className="mt-2" style={{ textAlign: 'center' }}>
                <Link to="/applications" className="btn btn-secondary btn-sm">
                  View all {applications.length} applications
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
