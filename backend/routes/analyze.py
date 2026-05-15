from flask import Blueprint, request, jsonify
from models import db, Resume, JobPosting, Application
from services.llm import analyze_application

analyze_bp = Blueprint('analyze', __name__)


@analyze_bp.route('/', methods=['POST'])
def run_analysis():
    data = request.get_json()
    if not data or not data.get('resume_id') or not data.get('job_posting_id'):
        return jsonify({'error': 'resume_id and job_posting_id are required'}), 400

    resume = db.get_or_404(Resume, data['resume_id'])
    job = db.get_or_404(JobPosting, data['job_posting_id'])

    try:
        result = analyze_application(resume.content, job.content)
    except Exception as e:
        return jsonify({'error': f'LLM analysis failed: {str(e)}'}), 500

    application = Application(
        resume_id=resume.id,
        job_posting_id=job.id,
        tailored_resume=result.get('tailoredResume', ''),
        cover_letter=result.get('coverLetter', ''),
        alignment_score=result.get('alignmentScore'),
        alignment_summary=result.get('alignmentSummary', ''),
        missing_keywords=result.get('missingKeywords', []),
        strengths=result.get('strengths', []),
    )
    db.session.add(application)
    db.session.commit()

    return jsonify(application.to_dict(include_content=True)), 201
