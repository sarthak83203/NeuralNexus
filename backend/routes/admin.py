from flask import Blueprint, request, jsonify, session
from models import User, Transaction, FlaggedTransaction
from services.gemini_service import gemini_service
from config import Config
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)

@admin_bp.before_request
def restrict_to_admin():
    if not session.get('is_admin'):
        return jsonify({'error': 'Access denied — admin only'}), 403

@admin_bp.route('/flagged', methods=['GET'])
def get_flagged():
    limit = int(request.args.get('limit', 50))
    flagged_txs = FlaggedTransaction.get_all(limit)
    
    # Serialize
    for tx in flagged_txs:
        tx['_id'] = str(tx['_id'])
        if 'transaction_id' in tx:
            tx['transaction_id'] = str(tx['transaction_id'])
        if 'timestamp' in tx:
            tx['timestamp'] = tx['timestamp'].isoformat()
        if 'created_at' in tx:
            tx['created_at'] = tx['created_at'].isoformat()
        if 'reviewed_at' in tx and tx['reviewed_at']:
            tx['reviewed_at'] = tx['reviewed_at'].isoformat()
            
        # Get username for each flagged tx
        user = User.find_by_id(tx.get('user_id'))
        if user:
            tx['username'] = user['username']
            
    ai_summary = gemini_service.admin_risk_summary(flagged_txs)
    
    return jsonify({
        'flagged_transactions': flagged_txs,
        'count': len(flagged_txs),
        'ai_summary': ai_summary
    }), 200

@admin_bp.route('/flagged/<flagged_id>/review', methods=['POST'])
def review_flagged(flagged_id):
    try:
        FlaggedTransaction.mark_reviewed(flagged_id, session.get('username'))
        return jsonify({'success': True, 'message': 'Marked as reviewed'}), 200
    except Exception as e:
        logger.error(f"Review error: {e}")
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/stats', methods=['GET'])
def get_stats():
    total_users = User.collection.count_documents({})
    total_tx = Transaction.collection.count_documents({})
    total_blocked = Transaction.collection.count_documents({'blocked': True})
    total_flagged = FlaggedTransaction.collection.count_documents({})
    unreviewed = FlaggedTransaction.collection.count_documents({'reviewed': False})
    
    block_rate = round(total_blocked / max(total_tx, 1) * 100, 2)
    
    return jsonify({
        'total_users': total_users,
        'total_tx': total_tx,
        'total_blocked': total_blocked,
        'total_flagged': total_flagged,
        'unreviewed_count': unreviewed,
        'block_rate': block_rate
    }), 200
