import hashlib
import secrets
from datetime import datetime, timedelta
from database.mongodb import mongo

def hash_password(password: str) -> str:
    """SHA-256 hash of password"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def check_password(plain: str, hashed: str) -> bool:
    """Hash plain and compare to hashed"""
    return hash_password(plain) == hashed

def utcnow() -> datetime:
    """Current UTC time as naive datetime"""
    return datetime.utcnow()

def hours_since(past_dt: datetime) -> float:
    """Hours between past_dt and now"""
    if not past_dt:
        return 24.0
    delta = utcnow() - past_dt
    return delta.total_seconds() / 3600.0

def create_session(user_id: str) -> str:
    """Generates a session token and stores in mongo"""
    session_id = secrets.token_urlsafe(32)
    expiry = utcnow() + timedelta(hours=24)
    
    mongo.sessions.insert_one({
        'session_id': session_id,
        'user_id': str(user_id),
        'created_at': utcnow(),
        'expires_at': expiry
    })
    return session_id

def validate_session(session_id: str) -> dict:
    """Looks up and validates session_id"""
    if not session_id:
        return None
        
    session = mongo.sessions.find_one({
        'session_id': session_id,
        'expires_at': {'$gt': utcnow()}
    })
    return session
