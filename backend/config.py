import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    MONGO_DB = os.getenv('MONGO_DB', 'upiguard')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')
    FRAUD_THRESHOLD = float(os.getenv('FRAUD_THRESHOLD', 0.70))
    SEQUENCE_LENGTH = int(os.getenv('SEQUENCE_LENGTH', 10))
    MIN_TRANSACTIONS = int(os.getenv('MIN_TRANSACTIONS', 9))
    MAX_TX_AMOUNT = float(os.getenv('MAX_TRANSACTION_AMOUNT', 10000000))
    DAILY_TX_LIMIT = float(os.getenv('DAILY_TRANSACTION_LIMIT', 50000))
    ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin@123')
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
