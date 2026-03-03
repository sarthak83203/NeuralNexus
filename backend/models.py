from database.mongodb import mongo
from bson import ObjectId
from utils.helpers import utcnow

class User:
    collection = mongo.users

    @staticmethod
    def create(username, password, email=None):
        doc = {
            'username': username,
            'password': password,  # already hashed
            'email': email,
            'balance': 10000.0,
            'created_at': utcnow(),
            'last_login': None,
            'is_active': True
        }
        result = mongo.users.insert_one(doc)
        return str(result.inserted_id)

    @staticmethod
    def find_by_username(username) -> dict:
        return mongo.users.find_one({'username': username})

    @staticmethod
    def find_by_id(user_id) -> dict:
        try:
            return mongo.users.find_one({'_id': ObjectId(user_id)})
        except:
            return None

    @staticmethod
    def update_last_login(user_id):
        mongo.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'last_login': utcnow()}}
        )

    @staticmethod
    def update_balance(user_id, delta: float):
        mongo.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$inc': {'balance': delta}}
        )

class Transaction:
    collection = mongo.transactions

    @staticmethod
    def create(user_id, amount, location, time_gap, hour, blocked=False, explanation=None, fraud_probability=0.0, risk_factors=None):
        doc = {
            'user_id': str(user_id),
            'amount': float(amount),
            'location': int(location),
            'time_gap': float(time_gap),
            'hour': int(hour),
            'timestamp': utcnow(),
            'blocked': bool(blocked),
            'explanation': explanation,
            'fraud_probability': float(fraud_probability),
            'risk_factors': risk_factors or []
        }
        result = mongo.transactions.insert_one(doc)
        return str(result.inserted_id)

    @staticmethod
    def get_recent(user_id, limit=9) -> list:
        cursor = mongo.transactions.find(
            {'user_id': str(user_id)}
        ).sort('timestamp', -1).limit(limit)
        
        txs = list(cursor)
        # Reverse to get oldest first for sequence building
        txs.reverse()
        return txs

    @staticmethod
    def get_history(user_id, limit=20) -> list:
        cursor = mongo.transactions.find(
            {'user_id': str(user_id)}
        ).sort('timestamp', -1).limit(limit)
        return list(cursor)

class FlaggedTransaction:
    collection = mongo.flagged

    @staticmethod
    def create(tx_data: dict, fraud_probability: float, explanation: str, risk_factors: list):
        # Insert the tx_data plus additional fields
        doc = tx_data.copy()
        # Ensure ID from transactions is not copied as _id if it exists
        if '_id' in doc:
            doc['transaction_id'] = str(doc.pop('_id'))
            
        doc.update({
            'fraud_probability': float(fraud_probability),
            'explanation': explanation,
            'risk_factors': risk_factors or [],
            'reviewed': False,
            'reviewed_by': None,
            'reviewed_at': None,
            'created_at': utcnow()
        })
        
        # Ensure user_id is string
        if 'user_id' in doc:
            doc['user_id'] = str(doc['user_id'])
            
        result = mongo.flagged.insert_one(doc)
        return str(result.inserted_id)

    @staticmethod
    def get_all(limit=50) -> list:
        cursor = mongo.flagged.find().sort('created_at', -1).limit(limit)
        return list(cursor)

    @staticmethod
    def mark_reviewed(flagged_id, reviewer_username):
        mongo.flagged.update_one(
            {'_id': ObjectId(flagged_id)},
            {'$set': {
                'reviewed': True,
                'reviewed_by': reviewer_username,
                'reviewed_at': utcnow()
            }}
        )
