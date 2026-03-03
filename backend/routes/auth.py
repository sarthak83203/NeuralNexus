from flask import Blueprint, request, jsonify, session
from models import User
from utils.helpers import hash_password, check_password
from config import Config
import re

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
        
    user = User.find_by_username(username)
    if not user or not check_password(password, user['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
        
    if not user.get('is_active', True):
        return jsonify({'error': 'Account is deactivated'}), 403
        
    User.update_last_login(str(user['_id']))
    
    # Set Flask session
    session['user_id'] = str(user['_id'])
    session['username'] = user['username']
    session['is_admin'] = (user['username'] == Config.ADMIN_USERNAME)
    
    return jsonify({
        'success': True,
        'user_id': str(user['_id']),
        'username': user['username'],
        'balance': user.get('balance', 0.0),
        'is_admin': session['is_admin']
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
        
    # Validation: username 3-20 alphanumeric+underscore
    if not re.match(r'^\w{3,20}$', username):
        return jsonify({'error': 'Username must be 3-20 alphanumeric characters or underscores'}), 400
        
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
    # Check for duplicate
    if User.find_by_username(username):
        return jsonify({'error': 'Username already exists'}), 409
        
    hashed = hash_password(password)
    user_id = User.create(username, hashed, email)
    
    return jsonify({
        'success': True,
        'message': 'Registration successful',
        'user_id': user_id
    }), 201

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out'}), 200

@auth_bp.route('/me', methods=['GET'])
def me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'authenticated': False}), 401
        
    user = User.find_by_id(user_id)
    if not user:
        session.clear()
        return jsonify({'authenticated': False}), 401
        
    return jsonify({
        'authenticated': True,
        'user_id': str(user['_id']),
        'username': user['username'],
        'balance': user.get('balance', 0.0),
        'is_admin': session.get('is_admin', False)
    }), 200
