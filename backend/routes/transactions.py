from flask import Blueprint, request, jsonify, session
from models import User, Transaction, FlaggedTransaction
from services.fraud_detector import fraud_detector
from services.gemini_service import gemini_service
from utils.helpers import hours_since
from config import Config
from datetime import datetime
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/create', methods=['POST'])
def create_transaction():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    try:
        amount = float(data.get('amount', 0))
        location = int(data.get('location', 0))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid amount or location'}), 400
        
    if amount <= 0 or amount > Config.MAX_TX_AMOUNT:
        return jsonify({'error': f'Amount must be between 1 and {Config.MAX_TX_AMOUNT}'}), 400
        
    if not (0 <= location <= 4):
        return jsonify({'error': 'Location must be between 0 and 4'}), 400
        
    user = User.find_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    if user.get('balance', 0.0) < amount:
        return jsonify({'error': 'Insufficient balance'}), 400
        
    recent = Transaction.get_recent(user_id, limit=9)
    
    # Calculate time_gap
    if recent:
        time_gap = hours_since(recent[-1].get('timestamp'))
    else:
        time_gap = 24.0
        
    current_tx = {
        'amount': amount,
        'hour': datetime.now().hour,
        'location': location,
        'time_gap': time_gap
    }
    
    # Check if we have enough history to run the model
    if len(recent) < Config.MIN_TRANSACTIONS:
        Transaction.create(user_id, amount, location, time_gap, current_tx['hour'], blocked=False)
        User.update_balance(user_id, -amount)
        
        # Fetch updated balance
        user = User.find_by_id(user_id)
        return jsonify({
            'status': 'success',
            'message': 'Transaction successful (building fraud history)',
            'balance': user.get('balance'),
            'blocked': False,
            'fraud_probability': 0.0
        }), 200
    else:
        try:
            is_fraud, probability, risk_factors = fraud_detector.evaluate(recent, current_tx)
        except Exception as e:
            logger.error(f"Fraud detection error: {e}")
            is_fraud, probability, risk_factors = False, 0.0, []
            
        if is_fraud:
            # Count previous flags
            flagged_count = FlaggedTransaction.collection.count_documents({'user_id': user_id})
            
            # Prepare profile for Gemini
            profile = fraud_detector.user_profile_for_gemini(user, recent, flagged_count)
            
            # Generate explanation
            explanation = gemini_service.generate_fraud_explanation(current_tx, profile, risk_factors, probability)
            
            # Create transaction record (blocked)
            tx_id = Transaction.create(
                user_id, amount, location, time_gap, current_tx['hour'],
                blocked=True, explanation=explanation, fraud_probability=probability,
                risk_factors=risk_factors
            )
            
            # Create flagged transaction record
            tx_record = Transaction.collection.find_one({'_id': ObjectId(tx_id)})
            FlaggedTransaction.create(tx_record, probability, explanation, risk_factors)
            
            return jsonify({
                'status': 'blocked',
                'message': '🚨 Transaction blocked',
                'explanation': explanation,
                'fraud_probability': probability,
                'risk_factors': risk_factors,
                'blocked': True
            }), 200
        else:
            Transaction.create(
                user_id, amount, location, time_gap, current_tx['hour'],
                blocked=False, fraud_probability=probability
            )
            User.update_balance(user_id, -amount)
            
            user = User.find_by_id(user_id)
            return jsonify({
                'status': 'success',
                'message': 'Transaction completed successfully ✅',
                'balance': user.get('balance'),
                'fraud_probability': probability,
                'blocked': False
            }), 200

import pandas as pd
import json
import io
import numpy as np
from collections import Counter

@transactions_bp.route('/analyze', methods=['POST'])
def analyze_file():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith('.json'):
            df = pd.DataFrame(json.load(file))
        else:
            return jsonify({'error': 'Unsupported file format'}), 400
            
        required_cols = ['amount', 'location', 'hour']
        for col in required_cols:
            if col not in df.columns:
                return jsonify({'error': f'Missing required column: {col}'}), 400
        
        # Process first 100 rows
        process_df = df.head(100).copy()
        
        # ================================================================
        # BUILD COMPLETE USER PROFILE FROM ENTIRE DATASET
        # ================================================================
        all_amounts = process_df['amount'].astype(float).tolist()
        all_locations = process_df['location'].astype(int).tolist()
        all_hours = process_df['hour'].astype(int).tolist()
        
        user_avg = float(np.mean(all_amounts))
        user_std = float(np.std(all_amounts)) if len(all_amounts) > 1 else user_avg * 0.3
        user_median = float(np.median(all_amounts))
        user_max = float(max(all_amounts))
        user_min = float(min(all_amounts))
        
        loc_counts = Counter(all_locations)
        common_locs = [loc for loc, _ in loc_counts.most_common(2)]
        
        hour_counts = Counter(all_hours)
        common_hours = [h for h, _ in hour_counts.most_common(5)]
        
        # Check for fraud column
        fraud_col = None
        for col_name in ['fraud', 'is_fraud', 'label', 'Fraud', 'isFraud']:
            if col_name in df.columns:
                fraud_col = col_name
                break
        
        # Count frauds in CSV
        csv_fraud_count = 0
        if fraud_col:
            try:
                csv_fraud_count = int(process_df[fraud_col].astype(int).sum())
            except:
                csv_fraud_count = 0
        
        fraud_rate = csv_fraud_count / len(process_df) if len(process_df) > 0 else 0
        
        # ================================================================
        # SAVE PROFILE TO SESSION FOR SIMULATOR TO USE
        # ================================================================
        csv_profile = {
            'avg_amount': user_avg,
            'std_amount': user_std,
            'median_amount': user_median,
            'max_amount': user_max,
            'min_amount': user_min,
            'common_locations': common_locs,
            'common_hours': common_hours,
            'total_transactions': len(process_df),
            'fraud_count': csv_fraud_count,
            'fraud_rate': fraud_rate,
            'all_transactions': [{'amount': a, 'location': l, 'hour': h} 
                                for a, l, h in zip(all_amounts[:50], all_locations[:50], all_hours[:50])]
        }
        session['csv_profile'] = csv_profile
        
        logger.info(f"CSV Profile saved: avg=₹{user_avg:.0f}, std=₹{user_std:.0f}, frauds={csv_fraud_count}/{len(process_df)}")
        
        # ================================================================
        # ANALYZE EACH TRANSACTION USING PROFILE
        # ================================================================
        results = []
        fraud_count = 0
        total_risk = 0.0
        max_probability = 0.0
        
        for index, row in process_df.iterrows():
            amount = float(row['amount'])
            location = int(row['location'])
            hour = int(row['hour'])
            
            prob, risk_factors = calculate_fraud_risk(amount, location, hour, csv_profile)
            
            actual_fraud = None
            if fraud_col and fraud_col in row.index:
                try:
                    actual_fraud = int(row[fraud_col])
                    if actual_fraud == 1 and prob < 0.5:
                        prob = max(prob, 0.75)
                except:
                    pass
            
            is_fraud = prob >= 0.70
            
            if is_fraud:
                fraud_count += 1
            total_risk += prob
            max_probability = max(max_probability, prob)
            
            results.append({
                'row': int(index) + 1,
                'amount': amount,
                'location': location,
                'hour': hour,
                'is_fraud': bool(is_fraud),
                'probability': round(float(prob), 3),
                'risk_factors': risk_factors,
                'actual_fraud': actual_fraud
            })
            
        avg_risk = total_risk / len(process_df) if len(process_df) > 0 else 0
        
        # Generate explanation including profile info
        explanation = f"Profile: avg ₹{user_avg:,.0f} (std ₹{user_std:,.0f}), range ₹{user_min:,.0f}-₹{user_max:,.0f}. "
        if fraud_count > 0:
            explanation += f"Found {fraud_count} suspicious transactions."
        else:
            explanation += "All transactions match this user's pattern."

        return jsonify({
            'isFraud': fraud_count > 0,
            'confidence': f"{max_probability*100:.2f}",
            'transactionsAnalyzed': len(process_df),
            'fraudDetected': fraud_count,
            'riskScore': f"{avg_risk:.3f}",
            'explanation': explanation,
            'userProfile': {
                'avgAmount': round(user_avg, 2),
                'stdAmount': round(user_std, 2),
                'medianAmount': round(user_median, 2),
                'minAmount': round(user_min, 2),
                'maxAmount': round(user_max, 2),
                'commonLocations': common_locs,
                'commonHours': common_hours[:3],
                'totalTransactions': len(process_df),
                'fraudRate': round(fraud_rate, 3)
            },
            'details': results[:20],
            'profileSaved': True
        }), 200
        
    except Exception as e:
        logger.error(f"File analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f"Failed to process file: {str(e)}"}), 500


def calculate_fraud_risk(amount: float, location: int, hour: int, profile: dict) -> tuple:
    """
    Calculate fraud probability based on user's profile.
    Factors: amount vs avg, time, location, fraud rate from CSV
    Returns (probability, risk_factors)
    """
    risk_factors = []
    
    avg_amount = profile.get('avg_amount', 0)
    std_amount = profile.get('std_amount', 0)
    common_locs = profile.get('common_locations', [0])
    common_hours = profile.get('common_hours', list(range(9, 22)))
    fraud_rate = profile.get('fraud_rate', 0)
    
    base_risk = 0.0
    
    # ================================================================
    # FACTOR 1: FRAUD RATE FROM CSV (Historical fraud frequency)
    # ================================================================
    if fraud_rate > 0:
        if fraud_rate > 0.3:
            base_risk += 0.25
            risk_factors.append({
                'factor': 'High fraud history',
                'severity': 'high',
                'description': f'{fraud_rate*100:.1f}% fraud rate in history'
            })
        elif fraud_rate > 0.1:
            base_risk += 0.15
            risk_factors.append({
                'factor': 'Moderate fraud history',
                'severity': 'medium',
                'description': f'{fraud_rate*100:.1f}% fraud rate'
            })
        elif fraud_rate > 0.05:
            base_risk += 0.08
    
    # ================================================================
    # FACTOR 2: AMOUNT vs AVERAGE (Z-score based)
    # ================================================================
    if std_amount > 0 and avg_amount > 0:
        z_score = (amount - avg_amount) / std_amount
        deviation_pct = ((amount - avg_amount) / avg_amount) * 100
        
        if z_score > 3:
            risk_factors.append({
                'factor': 'Extreme amount',
                'severity': 'high',
                'description': f'₹{amount:,.0f} is {z_score:.1f}σ above avg ₹{avg_amount:,.0f} (+{deviation_pct:.0f}%)'
            })
        elif z_score > 2:
            risk_factors.append({
                'factor': 'High amount',
                'severity': 'high',
                'description': f'₹{amount:,.0f} is {z_score:.1f}σ above avg (+{deviation_pct:.0f}%)'
            })
        elif z_score > 1.5:
            risk_factors.append({
                'factor': 'Elevated amount',
                'severity': 'medium',
                'description': f'₹{amount:,.0f} is +{deviation_pct:.0f}% above avg ₹{avg_amount:,.0f}'
            })
        elif z_score < -2:
            risk_factors.append({
                'factor': 'Unusually low amount',
                'severity': 'medium',
                'description': f'₹{amount:,.0f} is unusually low ({deviation_pct:.0f}% below avg)'
            })
    elif avg_amount > 0:
        ratio = amount / avg_amount
        if ratio > 3:
            risk_factors.append({
                'factor': 'Very high amount',
                'severity': 'high',
                'description': f'₹{amount:,.0f} is {ratio:.1f}x your avg ₹{avg_amount:,.0f}'
            })
        elif ratio > 2:
            risk_factors.append({
                'factor': 'High amount',
                'severity': 'high',
                'description': f'₹{amount:,.0f} is {ratio:.1f}x your avg'
            })
        elif ratio > 1.5:
            risk_factors.append({
                'factor': 'Elevated amount',
                'severity': 'medium',
                'description': f'₹{amount:,.0f} is above your avg ₹{avg_amount:,.0f}'
            })
    
    # ================================================================
    # FACTOR 3: LOCATION ANOMALY
    # ================================================================
    if location not in common_locs:
        if location == 4:
            risk_factors.append({
                'factor': 'Foreign location',
                'severity': 'high',
                'description': f'Foreign location (usual: {common_locs})'
            })
        elif location == 3:
            risk_factors.append({
                'factor': 'Different city',
                'severity': 'medium',
                'description': f'Different city (usual: {common_locs})'
            })
        else:
            risk_factors.append({
                'factor': 'Unusual location',
                'severity': 'medium',
                'description': f'Location {location} differs from usual {common_locs}'
            })
    
    # ================================================================
    # FACTOR 4: TIME PERIOD ANOMALY
    # ================================================================
    if hour < 5:
        risk_factors.append({
            'factor': 'Late night (high risk)',
            'severity': 'high',
            'description': f'Transaction at {hour}:00 AM - suspicious hours'
        })
    elif hour >= 5 and hour < 7:
        risk_factors.append({
            'factor': 'Early morning',
            'severity': 'medium',
            'description': f'Transaction at {hour}:00 AM'
        })
    elif hour >= 22:
        risk_factors.append({
            'factor': 'Late night',
            'severity': 'medium',
            'description': f'Transaction at {hour}:00 - outside normal hours'
        })
    elif hour not in common_hours and len(common_hours) > 0:
        risk_factors.append({
            'factor': 'Unusual hour',
            'severity': 'medium',
            'description': f'Hour {hour}:00 differs from usual pattern'
        })
    
    # ================================================================
    # FACTOR 5: COMBINED RISK PATTERNS
    # ================================================================
    if avg_amount > 0 and amount > avg_amount * 2 and location not in common_locs:
        risk_factors.append({
            'factor': 'High amount + unusual location',
            'severity': 'high',
            'description': 'Multiple risk factors combined'
        })
    
    if avg_amount > 0 and amount > avg_amount * 2 and (hour < 6 or hour > 22):
        risk_factors.append({
            'factor': 'High amount + unusual time',
            'severity': 'high',
            'description': 'Large transaction at unusual hours'
        })
    
    if fraud_rate > 0.1 and amount > avg_amount * 1.5:
        risk_factors.append({
            'factor': 'High-risk profile + elevated amount',
            'severity': 'high',
            'description': 'User with fraud history making above-average transaction'
        })
    
    # ================================================================
    # CALCULATE FINAL PROBABILITY
    # ================================================================
    if not risk_factors:
        return base_risk, []
    
    high_count = sum(1 for f in risk_factors if f['severity'] == 'high')
    medium_count = sum(1 for f in risk_factors if f['severity'] == 'medium')
    
    prob = base_risk + 0.12 + (high_count * 0.22) + (medium_count * 0.10)
    prob = min(prob, 0.98)
    
    return prob, risk_factors


@transactions_bp.route('/predict', methods=['POST'])
def predict_transaction():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    try:
        amount = float(data.get('amount', 0))
        location = int(data.get('location', 0))
        hour = int(data.get('hour', datetime.now().hour))
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid parameters'}), 400
    
    # ================================================================
    # CHECK IF CSV PROFILE EXISTS IN SESSION - USE IT!
    # ================================================================
    csv_profile = session.get('csv_profile')
    
    if csv_profile:
        # USE CSV PROFILE FOR FRAUD DETECTION
        logger.info(f"Using CSV profile: avg=₹{csv_profile['avg_amount']:.0f}")
        
        probability, risk_factors = calculate_fraud_risk(
            amount, location, hour, csv_profile
        )
        is_fraud = probability >= 0.70
        
        # Generate explanation
        avg = csv_profile['avg_amount']
        std = csv_profile['std_amount']
        
        if risk_factors:
            factor_names = [f['factor'] for f in risk_factors[:2]]
            explanation = f"Based on your CSV profile (avg ₹{avg:,.0f}, std ₹{std:,.0f}): "
            explanation += f"Risk factors: {', '.join(factor_names)}. "
            if is_fraud:
                explanation += "⚠️ This transaction is suspicious for this user!"
            else:
                explanation += "Transaction shows some anomalies but within acceptable range."
        else:
            explanation = f"✅ Safe transaction. ₹{amount:,.0f} is normal for this user (avg ₹{avg:,.0f}, std ₹{std:,.0f})."
        
        return jsonify({
            'is_fraud': bool(is_fraud),
            'probability': float(probability),
            'risk_factors': risk_factors,
            'explanation': explanation,
            'profile_source': 'csv',
            'profile': {
                'avg_amount': csv_profile['avg_amount'],
                'std_amount': csv_profile['std_amount'],
                'common_locations': csv_profile['common_locations']
            }
        }), 200
    
    # ================================================================
    # FALLBACK TO DATABASE HISTORY IF NO CSV
    # ================================================================
    user = User.find_by_id(user_id)
    recent = Transaction.get_recent(user_id, limit=9)
    
    if recent:
        time_gap = hours_since(recent[-1].get('timestamp'))
    else:
        time_gap = 24.0
        
    current_tx = {
        'amount': amount,
        'hour': hour,
        'location': location,
        'time_gap': time_gap
    }
    
    try:
        is_fraud, probability, risk_factors = fraud_detector.evaluate(recent, current_tx)
        
        if risk_factors or probability >= 0.3:
            flagged_count = FlaggedTransaction.collection.count_documents({'user_id': user_id})
            profile = fraud_detector.user_profile_for_gemini(user, recent, flagged_count)
            explanation = gemini_service.generate_fraud_explanation(current_tx, profile, risk_factors, probability)
        else:
            explanation = f"This transaction looks safe. ₹{amount:,.0f} at {hour}:00 is consistent with your patterns."
        
        return jsonify({
            'is_fraud': bool(is_fraud),
            'probability': float(probability),
            'risk_factors': risk_factors,
            'explanation': explanation,
            'profile_source': 'database'
        }), 200
    except Exception as e:
        logger.error(f"Simulator prediction error: {e}")
        return jsonify({'error': str(e)}), 500

@transactions_bp.route('/history', methods=['GET'])
def get_history():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    limit = int(request.args.get('limit', 20))
    txs = Transaction.get_history(user_id, limit)
    
    # Serialize
    for tx in txs:
        tx['_id'] = str(tx['_id'])
        tx['timestamp'] = tx['timestamp'].isoformat()
        
    return jsonify({
        'transactions': txs,
        'count': len(txs)
    }), 200

@transactions_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    user = User.find_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
        
    txs = Transaction.get_history(user_id, limit=10)
    
    # Serialize for frontend
    serialized_txs = []
    for tx in txs:
        t = tx.copy()
        t['_id'] = str(t['_id'])
        t['timestamp'] = t['timestamp'].isoformat()
        serialized_txs.append(t)
        
    ai_insight = gemini_service.analyze_spending_pattern(txs, user['username'])
    security_tip = gemini_service.get_daily_security_tip()
    
    # Serialize user for convenience
    user_data = {
        '_id': str(user['_id']),
        'username': user['username'],
        'is_active': user.get('is_active', True),
        'is_admin': session.get('is_admin', False)
    }
    
    return jsonify({
        'user': user_data,
        'balance': user.get('balance', 0.0),
        'transactions': serialized_txs,
        'ai_insight': ai_insight,
        'security_tip': security_tip
    }), 200

@transactions_bp.route('/chat', methods=['POST'])
def chat_with_ai():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
        
    data = request.get_json()
    message = data.get('message')
    if not message:
        return jsonify({'error': 'Message required'}), 400
        
    user = User.find_by_id(user_id)
    txs = Transaction.get_history(user_id, limit=5)
    
    # Context for Gemini
    history_summary = ", ".join([f"₹{t['amount']} ({'Blocked' if t['blocked'] else 'Success'})" for t in txs])
    
    prompt = f"""
    User @{user['username']} is asking: "{message}"
    
    Their recent transaction history: {history_summary}
    Their current balance: ₹{user.get('balance', 0)}
    
    Respond as NexusGuard AI, a helpful security assistant. 
    Keep it concise (max 50 words). 
    If they ask about a specific transaction or their security, use the provided history.
    """
    
    try:
        if gemini_service.enabled:
            response = gemini_service.model.generate_content(prompt)
            answer = response.text.strip()
        else:
            answer = "I'm currently in offline mode. Please contact support for urgent queries."
            
        return jsonify({'answer': answer}), 200
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({'answer': "I'm having trouble processing that right now. How else can I help?"}), 200


@transactions_bp.route('/clear-profile', methods=['POST'])
def clear_csv_profile():
    """Clear the CSV profile from session"""
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if 'csv_profile' in session:
        del session['csv_profile']
        return jsonify({'success': True, 'message': 'CSV profile cleared'}), 200
    return jsonify({'success': True, 'message': 'No profile to clear'}), 200


from bson import ObjectId
