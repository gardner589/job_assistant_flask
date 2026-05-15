import os
from flask import Flask, jsonify
from flask_cors import CORS
from models import db


def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/job_assistant'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

    CORS(app)
    db.init_app(app)

    from routes.resumes import resumes_bp
    from routes.jobs import jobs_bp
    from routes.analyze import analyze_bp
    from routes.applications import applications_bp

    app.register_blueprint(resumes_bp, url_prefix='/api/resumes')
    app.register_blueprint(jobs_bp, url_prefix='/api/jobs')
    app.register_blueprint(analyze_bp, url_prefix='/api/analyze')
    app.register_blueprint(applications_bp, url_prefix='/api/applications')

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    with app.app_context():
        db.create_all()

    return app


app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
