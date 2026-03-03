from config import Config
import numpy as np
from collections import Counter

# Try to import TensorFlow model, fallback to rule-based only
try:
    from model.utils import predict_fraud, prepare_sequence
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    predict_fraud = None
    prepare_sequence = None

class FraudDetector:
    def __init__(self):
        self._predict_fraud = predict_fraud
        self._prepare_sequence = prepare_sequence
        self.threshold = Config.FRAUD_THRESHOLD
        self.tensorflow_available = TENSORFLOW_AVAILABLE

    def evaluate(self, recent_transactions: list, current_tx: dict) -> tuple:
        """
        Returns (is_fraud: bool, probability: float, risk_factors: list)
        """
        # Get risk factors first
        risk_factors = self.rule_based_flags(current_tx, recent_transactions)
        
        # Use ML model if available
        if self.tensorflow_available and self._predict_fraud:
            is_fraud, probability = self._predict_fraud(recent_transactions, current_tx)
            # If model returns 0 or very low probability but risk factors exist, use rule-based
            if probability < 0.1 and risk_factors:
                high_severity = sum(1 for f in risk_factors if f['severity'] == 'high')
                medium_severity = sum(1 for f in risk_factors if f['severity'] == 'medium')
                probability = 0.1 + (high_severity * 0.25) + (medium_severity * 0.15)
                probability = min(probability, 0.95)
                is_fraud = probability >= self.threshold
            elif not risk_factors:
                # No risk factors = safe transaction regardless of model output
                probability = 0.0
                is_fraud = False
        else:
            # Rule-based fallback: calculate probability based on risk factors
            if not risk_factors:
                # No risk factors = safe transaction
                probability = 0.0
                is_fraud = False
            else:
                high_severity = sum(1 for f in risk_factors if f['severity'] == 'high')
                medium_severity = sum(1 for f in risk_factors if f['severity'] == 'medium')
                
                # Calculate probability: base 0.1 + high*0.25 + medium*0.15, capped at 0.95
                probability = 0.1 + (high_severity * 0.25) + (medium_severity * 0.15)
                probability = min(probability, 0.95)
                is_fraud = probability >= self.threshold
        
        return is_fraud, probability, risk_factors

    def rule_based_flags(self, current_tx: dict, history: list) -> list:
        flags = []
        amount = current_tx.get('amount', 0)
        location = current_tx.get('location', 0)
        hour = current_tx.get('hour', 0)
        gap = current_tx.get('time_gap', 24.0)

        # Rule 1 — HIGH AMOUNT (severity based on comparison or absolute)
        if history:
            avg_amount = np.mean([tx.get('amount', 0) for tx in history])
            if amount > avg_amount * 2.5:
                ratio = amount / max(avg_amount, 1)
                flags.append({
                    'factor': 'High amount',
                    'severity': 'high',
                    'description': f"₹{amount:,.0f} is {ratio:.1f}× your average of ₹{avg_amount:,.0f}"
                })
            elif amount > avg_amount * 1.5:
                ratio = amount / max(avg_amount, 1)
                flags.append({
                    'factor': 'Elevated amount',
                    'severity': 'medium',
                    'description': f"₹{amount:,.0f} is {ratio:.1f}× your average"
                })
        else:
            # No history - use absolute thresholds with graduated severity
            if amount > 100000:
                flags.append({
                    'factor': 'Very high amount',
                    'severity': 'high',
                    'description': f"₹{amount:,.0f} exceeds ₹100,000"
                })
            elif amount > 50000:
                flags.append({
                    'factor': 'High amount',
                    'severity': 'high',
                    'description': f"₹{amount:,.0f} exceeds ₹50,000"
                })
            elif amount > 25000:
                flags.append({
                    'factor': 'Elevated amount',
                    'severity': 'medium',
                    'description': f"₹{amount:,.0f} is above typical range"
                })

        # Rule 2 — UNUSUAL LOCATION (severity: 'medium')
        if history:
            locations = [tx.get('location', 0) for tx in history]
            most_common_loc = Counter(locations).most_common(1)[0][0]
            if location != most_common_loc:
                flags.append({
                    'factor': 'Unusual location',
                    'severity': 'medium',
                    'description': f"Payment from location {location}; you usually transact from location {most_common_loc}"
                })
        else:
            # Flag foreign locations more heavily when no history
            if location == 4:  # Foreign
                flags.append({
                    'factor': 'Foreign location',
                    'severity': 'medium',
                    'description': "Payment from foreign location (no prior history)"
                })

        # Rule 3 — RAPID SUCCESSION (severity: 'high')
        if gap < 0.25: # Less than 15 minutes
            flags.append({
                'factor': 'Rapid succession',
                'severity': 'high',
                'description': f"This payment was attempted just {gap*60:.0f} minutes after the last one"
            })

        # Rule 4 — UNUSUAL HOUR (severity: 'medium' or 'high')
        if hour < 5:
            flags.append({
                'factor': 'Late night transaction',
                'severity': 'high',
                'description': f"Payment at {hour}:00 (late night hours)"
            })
        elif hour > 23:
            flags.append({
                'factor': 'Unusual time',
                'severity': 'medium',
                'description': f"Payment at {hour}:00 (outside normal hours)"
            })

        # Rule 5 — SUSPICIOUS COMBINATIONS
        if amount > 30000 and location == 4:
            flags.append({
                'factor': 'High amount + foreign location',
                'severity': 'high',
                'description': f"Large payment (₹{amount:,.0f}) from foreign location"
            })

        return flags

    def user_profile_for_gemini(self, user: dict, history: list, flagged_count: int) -> dict:
        # Filter history to non-blocked transactions only
        clean_history = [tx for tx in history if not tx.get('blocked')]
        
        if clean_history:
            amounts = [tx.get('amount', 0) for tx in clean_history]
            avg_amount = np.mean(amounts)
            
            locations = [tx.get('location', 0) for tx in clean_history]
            usual_location = Counter(locations).most_common(1)[0][0]
            
            hours = [tx.get('hour', 0) for tx in clean_history]
            usual_hours = f"{min(hours)}–{max(hours)}"
        else:
            avg_amount = 0.0
            usual_location = 0
            usual_hours = "9–21"
            
        return {
            'avg_amount': round(avg_amount, 2),
            'usual_location': usual_location,
            'usual_hours': usual_hours,
            'previous_flags': flagged_count,
            'recent_history': history[-5:] if history else []
        }

fraud_detector = FraudDetector()
