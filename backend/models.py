from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.dialects.postgresql import JSONB

db = SQLAlchemy()


class Resume(db.Model):
    __tablename__ = 'resumes'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    filename = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    applications = db.relationship('Application', back_populates='resume', cascade='all, delete-orphan')

    def to_dict(self, include_content=False):
        d = {
            'id': self.id,
            'name': self.name,
            'filename': self.filename,
            'created_at': self.created_at.isoformat(),
        }
        if include_content:
            d['content'] = self.content
        return d


class JobPosting(db.Model):
    __tablename__ = 'job_postings'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255))
    company = db.Column(db.String(255))
    url = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    applications = db.relationship('Application', back_populates='job_posting', cascade='all, delete-orphan')

    def to_dict(self, include_content=False):
        d = {
            'id': self.id,
            'title': self.title,
            'company': self.company,
            'url': self.url,
            'created_at': self.created_at.isoformat(),
        }
        if include_content:
            d['content'] = self.content
        return d


class Application(db.Model):
    __tablename__ = 'applications'

    id = db.Column(db.Integer, primary_key=True)
    resume_id = db.Column(db.Integer, db.ForeignKey('resumes.id'), nullable=False)
    job_posting_id = db.Column(db.Integer, db.ForeignKey('job_postings.id'), nullable=False)
    tailored_resume = db.Column(db.Text)
    cover_letter = db.Column(db.Text)
    alignment_score = db.Column(db.Integer)
    alignment_summary = db.Column(db.Text)
    missing_keywords = db.Column(JSONB)
    strengths = db.Column(JSONB)
    status = db.Column(db.String(50), default='pending')
    notes = db.Column(db.Text)
    applied_at = db.Column(db.Date)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    resume = db.relationship('Resume', back_populates='applications')
    job_posting = db.relationship('JobPosting', back_populates='applications')

    def to_dict(self, include_content=False):
        d = {
            'id': self.id,
            'resume_id': self.resume_id,
            'job_posting_id': self.job_posting_id,
            'alignment_score': self.alignment_score,
            'alignment_summary': self.alignment_summary,
            'missing_keywords': self.missing_keywords or [],
            'strengths': self.strengths or [],
            'status': self.status,
            'notes': self.notes,
            'applied_at': self.applied_at.isoformat() if self.applied_at else None,
            'created_at': self.created_at.isoformat(),
            'resume': self.resume.to_dict() if self.resume else None,
            'job_posting': self.job_posting.to_dict() if self.job_posting else None,
        }
        if include_content:
            d['tailored_resume'] = self.tailored_resume
            d['cover_letter'] = self.cover_letter
            if self.resume:
                d['resume']['content'] = self.resume.content
            if self.job_posting:
                d['job_posting']['content'] = self.job_posting.content
        return d
