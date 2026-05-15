from flask import Blueprint, request, jsonify
from models import db, JobPosting
from services.scraper import scrape_job_posting

jobs_bp = Blueprint('jobs', __name__)


@jobs_bp.route('/', methods=['GET'])
def get_jobs():
    jobs = JobPosting.query.order_by(JobPosting.created_at.desc()).all()
    return jsonify([j.to_dict() for j in jobs])


@jobs_bp.route('/<int:job_id>', methods=['GET'])
def get_job(job_id):
    job = db.get_or_404(JobPosting, job_id)
    return jsonify(job.to_dict(include_content=True))


@jobs_bp.route('/parse-url', methods=['POST'])
def parse_url():
    data = request.get_json()
    if not data or not data.get('url'):
        return jsonify({'error': 'url is required'}), 400

    try:
        scraped = scrape_job_posting(data['url'])
    except Exception as e:
        return jsonify({'error': f'Scraping failed: {str(e)}'}), 502

    job = JobPosting(
        url=data['url'],
        content=scraped['content'],
        title=data.get('title') or scraped['title'],
        company=data.get('company') or scraped['company'],
    )
    db.session.add(job)
    db.session.commit()
    return jsonify(job.to_dict(include_content=True)), 201


@jobs_bp.route('/text', methods=['POST'])
def create_text_job():
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({'error': 'content is required'}), 400

    job = JobPosting(
        title=data.get('title'),
        company=data.get('company'),
        content=data['content'],
    )
    db.session.add(job)
    db.session.commit()
    return jsonify(job.to_dict(include_content=True)), 201
