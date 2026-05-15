import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { resumesApi, jobsApi, analyzeApi, applicationsApi } from '../api.js';

function scoreClass(s) {
  if (s >= 70) return 'score-high';
  if (s >= 40) return 'score-medium';
  return 'score-low';
}

export default function Analyze() {
  const [resumes, setResumes] = useState([]);
  const [resumeTab, setResumeTab] = useState('saved');
  const [jobTab, setJobTab] = useState('url');
  const [resultTab, setResultTab] = useState('resume');

  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [pastedResume, setPastedResume] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobText, setJobText] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [saveStatus, setSaveStatus] = useState('pending');
  const [saveAppliedAt, setSaveAppliedAt] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);

  useEffect(() => {
    resumesApi.getAll().then(({ data }) => setResumes(data));
  }, []);

  const canAnalyze = resumeTab === 'saved'
    ? !!selectedResumeId
    : !!pastedResume.trim();
  const canAnalyzeJob = jobTab === 'url' ? !!jobUrl.trim() : !!jobText.trim();

  function reset() {
    setResult(null);
    setSaved(false);
    setError('');
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setError('');
    try {
      let resumeId = selectedResumeId;
      if (resumeTab === 'paste') {
        const { data } = await resumesApi.createText({ name: 'Pasted Resume', content: pastedResume });
        resumeId = data.id;
      }

      let jobId;
      if (jobTab === 'url') {
        const { data } = await jobsApi.parseUrl({ url: jobUrl, title: jobTitle, company: jobCompany });
        jobId = data.id;
      } else {
        const { data } = await jobsApi.createText({ title: jobTitle, company: jobCompany, content: jobText });
        jobId = data.id;
      }

      const { data } = await analyzeApi.run({ resume_id: resumeId, job_posting_id: jobId });
      setResult(data);
      setSavedId(data.id);
      setSaved(true);
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function saveApplication() {
    if (!result) return;
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await applicationsApi.update(result.id, {
        status: saveStatus,
        notes: saveNotes,
        applied_at: saveAppliedAt || null,
        tailored_resume: result.tailored_resume,
        cover_letter: result.cover_letter,
      });
      setSavedId(data.id);
      setSaved(true);
    } catch (e) {
      setSaveError(e.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <div>
        <div className="flex-between mb-2">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Analysis Results</h2>
          <button className="btn btn-secondary btn-sm" onClick={reset}>← New Analysis</button>
        </div>

        <div className="grid-2 mb-2" style={{ alignItems: 'start' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="text-muted text-sm mb-2">Alignment Score</div>
            <div className="score-ring" style={{ margin: '0 auto' }}>
              <div className={`score-circle ${scoreClass(result.alignment_score)}`}>{result.alignment_score}</div>
            </div>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>{result.alignment_summary}</p>
          </div>

          <div className="card">
            <div className="mb-2">
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>Missing Keywords</div>
              {result.missing_keywords.length === 0
                ? <p className="text-muted text-sm">None — great coverage!</p>
                : result.missing_keywords.map(kw => <span key={kw} className="chip chip-missing">{kw}</span>)
              }
            </div>
            <hr className="divider" />
            <div>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>Key Strengths</div>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', lineHeight: 1.8 }}>
                {result.strengths.map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="card mb-2">
          <div className="tabs">
            <button className={`tab ${resultTab === 'resume' ? 'active' : ''}`} onClick={() => setResultTab('resume')}>Tailored Resume</button>
            <button className={`tab ${resultTab === 'cover' ? 'active' : ''}`} onClick={() => setResultTab('cover')}>Cover Letter</button>
          </div>
          {resultTab === 'resume' && (
            <textarea rows={20} defaultValue={result.tailored_resume}
              style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}
              onChange={e => setResult(r => ({ ...r, tailored_resume: e.target.value }))} />
          )}
          {resultTab === 'cover' && (
            <textarea rows={20} defaultValue={result.cover_letter}
              onChange={e => setResult(r => ({ ...r, cover_letter: e.target.value }))} />
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Track This Application</h3>
          <div className="grid-2">
            <div className="form-group">
              <label>Status</label>
              <select value={saveStatus} onChange={e => setSaveStatus(e.target.value)}>
                <option value="pending">Pending (haven't applied yet)</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Applied Date</label>
              <input type="date" value={saveAppliedAt} onChange={e => setSaveAppliedAt(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea rows={3} value={saveNotes} onChange={e => setSaveNotes(e.target.value)} placeholder="Any notes about this application..." />
          </div>
          {saveError && <div className="alert alert-error">{saveError}</div>}
          {saved
            ? <div className="alert alert-success">Saved! <Link to={`/applications/${savedId}`}>View application →</Link></div>
            : <button className="btn btn-primary" disabled={saving} onClick={saveApplication}>
                {saving && <span className="spinner" />}
                {saving ? 'Saving...' : 'Save Application'}
              </button>
          }
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Analyze Job</h1>
        <p>Let the local AI tailor your resume, write a cover letter, and score your fit</p>
      </div>

      <div className="grid-2 mb-2" style={{ alignItems: 'start' }}>
        {/* Resume panel */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>📄 Your Resume</h2>
          <div className="tabs">
            <button className={`tab ${resumeTab === 'saved' ? 'active' : ''}`} onClick={() => setResumeTab('saved')}>Saved Resume</button>
            <button className={`tab ${resumeTab === 'paste' ? 'active' : ''}`} onClick={() => setResumeTab('paste')}>Paste Text</button>
          </div>
          {resumeTab === 'saved' && (
            resumes.length === 0
              ? <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <p>No resumes saved. <Link to="/resumes">Add one</Link>.</p>
                </div>
              : resumes.map(r => (
                <div key={r.id}
                  onClick={() => setSelectedResumeId(r.id)}
                  style={{
                    padding: '0.75rem', border: '1px solid', borderRadius: '8px', cursor: 'pointer',
                    marginBottom: '0.5rem', transition: 'all 0.15s',
                    borderColor: selectedResumeId === r.id ? 'var(--primary)' : 'var(--border)',
                    background: selectedResumeId === r.id ? 'rgba(56,189,248,0.08)' : 'transparent',
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{r.name}</div>
                  <div className="text-muted text-sm">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              ))
          )}
          {resumeTab === 'paste' && (
            <textarea rows={10} value={pastedResume} onChange={e => setPastedResume(e.target.value)} placeholder="Paste your resume text here..." />
          )}
        </div>

        {/* Job panel */}
        <div className="card">
          <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>💼 Job Posting</h2>
          <div className="tabs">
            <button className={`tab ${jobTab === 'url' ? 'active' : ''}`} onClick={() => setJobTab('url')}>Paste URL</button>
            <button className={`tab ${jobTab === 'text' ? 'active' : ''}`} onClick={() => setJobTab('text')}>Paste Text</button>
          </div>
          {jobTab === 'url' && (
            <>
              <div className="form-group"><label>Job Posting URL</label><input type="url" value={jobUrl} onChange={e => setJobUrl(e.target.value)} placeholder="https://jobs.example.com/..." /></div>
              <div className="form-group"><label>Job Title (optional)</label><input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" /></div>
              <div className="form-group"><label>Company (optional)</label><input type="text" value={jobCompany} onChange={e => setJobCompany(e.target.value)} placeholder="e.g. Acme Corp" /></div>
            </>
          )}
          {jobTab === 'text' && (
            <>
              <div className="form-group"><label>Job Title (optional)</label><input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" /></div>
              <div className="form-group"><label>Company (optional)</label><input type="text" value={jobCompany} onChange={e => setJobCompany(e.target.value)} placeholder="e.g. Acme Corp" /></div>
              <div className="form-group"><label>Job Description</label><textarea rows={8} value={jobText} onChange={e => setJobText(e.target.value)} placeholder="Paste the job description here..." /></div>
            </>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      <button
        className="btn btn-primary"
        disabled={!canAnalyze || !canAnalyzeJob || analyzing}
        onClick={runAnalysis}
        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
      >
        {analyzing && <span className="spinner" />}
        {analyzing ? 'Analyzing with local AI...' : '✨ Analyze & Generate'}
      </button>
      <p className="text-muted text-sm mt-1" style={{ textAlign: 'center' }}>
        This may take 1–3 minutes (local model inference)
      </p>
    </div>
  );
}
