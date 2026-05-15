from datetime import date
from flask import Blueprint, request, jsonify
from models import db, Application

applications_bp = Blueprint('applications', __name__)


@applications_bp.route('/', methods=['GET'])
def get_applications():
    apps = Application.query.order_by(Application.created_at.desc()).all()
    return jsonify([a.to_dict() for a in apps])


@applications_bp.route('/<int:app_id>', methods=['GET'])
def get_application(app_id):
    app = db.get_or_404(Application, app_id)
    return jsonify(app.to_dict(include_content=True))


@applications_bp.route('/<int:app_id>', methods=['PATCH'])
def update_application(app_id):
    app = db.get_or_404(Application, app_id)
    data = request.get_json() or {}

    if 'status' in data:
        app.status = data['status']
    if 'notes' in data:
        app.notes = data['notes']
    if 'applied_at' in data:
        app.applied_at = date.fromisoformat(data['applied_at']) if data['applied_at'] else None
    if 'tailored_resume' in data:
        app.tailored_resume = data['tailored_resume']
    if 'cover_letter' in data:
        app.cover_letter = data['cover_letter']

    db.session.commit()
    return jsonify(app.to_dict(include_content=True))


@applications_bp.route('/<int:app_id>', methods=['DELETE'])
def delete_application(app_id):
    app = db.get_or_404(Application, app_id)
    db.session.delete(app)
    db.session.commit()
    return jsonify({'message': 'Deleted'})
