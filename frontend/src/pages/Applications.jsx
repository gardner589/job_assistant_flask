import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../api.js';
import ApplicationCard from '../components/ApplicationCard.jsx';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  async function fetchApplications() {
    setLoading(true);
    const { data } = await applicationsApi.getAll();
    setApplications(data);
    setLoading(false);
  }

  useEffect(() => { fetchApplications(); }, []);

  const filtered = applications
    .filter(a => !filterStatus || a.status === filterStatus)
    .filter(a => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.job_posting?.title?.toLowerCase().includes(q) ||
        a.job_posting?.company?.toLowerCase().includes(q)
      );
    });

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1>Applications</h1>
          <p>Track every job you've applied to</p>
        </div>
        <Link to="/analyze" className="btn btn-primary">+ New Analysis</Link>
      </div>

      <div className="card mb-2">
        <div className="flex gap-2" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="offered">Offered</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or company..."
            style={{ flex: 1, minWidth: '200px' }}
          />
        </div>
      </div>

      {loading ? (
        <div className="empty-state card"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="icon">📋</div>
          <p>No applications found.</p>
          <Link to="/analyze" className="btn btn-primary mt-2">Analyze a job posting</Link>
        </div>
      ) : (
        filtered.map(app => (
          <ApplicationCard key={app.id} application={app} onDeleted={fetchApplications} />
        ))
      )}
    </div>
  );
}
