import io
import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from models import db, Resume

resumes_bp = Blueprint('resumes', __name__)

os.makedirs('/app/uploads', exist_ok=True)


@resumes_bp.route('/', methods=['GET'])
def get_resumes():
    resumes = Resume.query.order_by(Resume.created_at.desc()).all()
    return jsonify([r.to_dict() for r in resumes])


@resumes_bp.route('/<int:resume_id>', methods=['GET'])
def get_resume(resume_id):
    resume = db.get_or_404(Resume, resume_id)
    return jsonify(resume.to_dict(include_content=True))


@resumes_bp.route('/upload', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['file']
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    raw = file.read()
    reader = PdfReader(io.BytesIO(raw))
    content = '\n'.join(page.extract_text() or '' for page in reader.pages).strip()

    if not content:
        return jsonify({'error': 'Could not extract text from PDF'}), 422

    name = request.form.get('name') or file.filename.rsplit('.', 1)[0]
    resume = Resume(name=name, content=content, filename=secure_filename(file.filename))
    db.session.add(resume)
    db.session.commit()
    return jsonify(resume.to_dict(include_content=True)), 201


@resumes_bp.route('/text', methods=['POST'])
def create_text_resume():
    data = request.get_json()
    if not data or not data.get('name') or not data.get('content'):
        return jsonify({'error': 'name and content are required'}), 400

    resume = Resume(name=data['name'], content=data['content'])
    db.session.add(resume)
    db.session.commit()
    return jsonify(resume.to_dict(include_content=True)), 201


@resumes_bp.route('/<int:resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    resume = db.get_or_404(Resume, resume_id)
    db.session.delete(resume)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
