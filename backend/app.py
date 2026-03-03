from flask import Flask, session, jsonify
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv

# Import components
from config import Config
from database.mongodb import init_db, mongo
from utils.helpers import hash_password, utcnow
from routes.auth import auth_bp
from routes.transactions import transactions_bp
from routes.admin import admin_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)-8s  %(name)s  %(message)s'
)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    
    # Load config
    app.secret_key = Config.SECRET_KEY
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
    
    # CORS configuration
    CORS(app, 
         origins=[Config.FRONTEND_URL], 
         supports_credentials=True,
         allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Initialize MongoDB
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Root route - API info
    @app.route('/', methods=['GET'])
    def root():
        return jsonify({
            'status': 'ok',
            'app': 'NexusGuard API',
            'version': '1.0',
            'message': 'API is running. Use /api/* endpoints.',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth',
                'transactions': '/api/transactions',
                'admin': '/api/admin'
            }
        }), 200
    
    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'ok',
            'app': 'UPIGUARD',
            'version': '1.0'
        }), 200
    
    # Seed admin user
    with app.app_context():
        _seed_admin()
        
    logger.info("UPIGUARD app created successfully")
    return app

def _seed_admin():
    from models import User
    admin_username = Config.ADMIN_USERNAME
    admin_password = Config.ADMIN_PASSWORD
    
    if not User.find_by_username(admin_username):
        hashed_pw = hash_password(admin_password)
        User.collection.insert_one({
            'username': admin_username,
            'password': hashed_pw,
            'balance': 0.0,
            'is_active': True,
            'is_admin': True,
            'created_at': utcnow()
        })
        logger.info("Admin account seeded")

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
