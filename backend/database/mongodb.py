from pymongo import MongoClient, ASCENDING, DESCENDING
from config import Config
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDB, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        try:
            self.client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
            # Ping to verify connection
            self.client.admin.command('ping')
            
            self.db = self.client[Config.MONGO_DB]
            
            # Collections
            self.users = self.db['users']
            self.transactions = self.db['transactions']
            self.flagged = self.db['flagged_transactions']
            self.sessions = self.db['sessions'] # Added for session storage
            
            # Indexes
            self.users.create_index([('username', ASCENDING)], unique=True)
            self.transactions.create_index([('user_id', ASCENDING), ('timestamp', DESCENDING)])
            self.transactions.create_index([('user_id', ASCENDING), ('blocked', ASCENDING)])
            self.flagged.create_index([('timestamp', DESCENDING)])
            self.flagged.create_index([('user_id', ASCENDING)])
            
            logger.info("MongoDB connected successfully")
            self._initialized = True
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            raise

def init_db(app):
    mongo_instance = MongoDB()
    if not hasattr(app, 'extensions'):
        app.extensions = {}
    app.extensions['mongo'] = mongo_instance
    return mongo_instance

mongo = MongoDB()
