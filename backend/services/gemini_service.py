from config import Config
import logging

logger = logging.getLogger(__name__)

# Try to import Gemini, fallback if not available
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None

class GeminiService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GeminiService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        
        self.enabled = False
        
        if not GEMINI_AVAILABLE:
            logger.warning("google-generativeai not installed. Gemini service disabled.")
        elif not Config.GEMINI_API_KEY:
            logger.warning("Gemini API key is missing. Gemini service disabled.")
        else:
            try:
                genai.configure(api_key=Config.GEMINI_API_KEY)
                self.model = genai.GenerativeModel(Config.GEMINI_MODEL)
                self.enabled = True
                logger.info(f"Gemini service initialized with model {Config.GEMINI_MODEL}")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini service: {e}")
        
        self._initialized = True

    def generate_fraud_explanation(self, transaction, user_profile, risk_factors, fraud_probability) -> str:
        if not self.enabled:
            return self._fallback_explanation(risk_factors)
            
        prompt = f"""
        Analyze this potentially fraudulent UPI transaction and provide a clear explanation for the user.
        
        Transaction Details:
        - Amount: ₹{transaction.get('amount')}
        - Hour: {transaction.get('hour')}:00
        - Location: Loc-{transaction.get('location')}
        - Time Gap: {transaction.get('time_gap')} hours
        
        User Profile:
        - Avg Amount: ₹{user_profile.get('avg_amount')}
        - Usual Location: Loc-{user_profile.get('usual_location')}
        - Usual Hours: {user_profile.get('usual_hours')}
        - Previous Flags: {user_profile.get('previous_flags')}
        - Recent History: {user_profile.get('recent_history')}
        
        Risk Factors identified by system:
        {chr(10).join([f"- {rf['factor']} (SEVERITY: {rf['severity'].upper()}): {rf['description']}" for rf in risk_factors])}
        
        Fraud Probability: {fraud_probability*100:.1f}%
        
        Instructions:
        - Max 80 words.
        - Friendly but serious tone.
        - Start with "We blocked this payment because..."
        - Include exactly 2 bullet points of what the user should do right now.
        """
        
        try:
            response = self.model.generate_content(prompt, generation_config={'temperature': 0.3})
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini API error, using fallback: {e}")
            return self._fallback_explanation(risk_factors)

    def analyze_spending_pattern(self, transactions: list, username: str) -> str:
        if not self.enabled:
            return "Unable to analyze spending patterns at this time."
            
        history_str = chr(10).join([
            f"₹{tx.get('amount')} at {tx.get('hour')}:00 loc-{tx.get('location')} {'[BLOCKED]' if tx.get('blocked') else ''}"
            for tx in transactions
        ])
        
        prompt = f"""
        User: {username}
        Recent Transactions:
        {history_str}
        
        Provide a 2-3 sentence personalised insight about their spending and 1 specific UPI safety tip.
        Max 60 words.
        """
        
        try:
            response = self.model.generate_content(prompt, generation_config={'temperature': 0.3})
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini spending analysis unavailable: {e}")
            return "Keep an eye on your transaction history for any suspicious activity."

    def get_daily_security_tip(self) -> str:
        if not self.enabled:
            return "Never share your UPI PIN or OTP with anyone, even if they claim to be from your bank."
            
        prompt = "Give ONE very short (max 20 words), practical, specific UPI safety tip. No preamble. Just the tip."
        
        try:
            response = self.model.generate_content(prompt, generation_config={'temperature': 0.3})
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini security tip unavailable: {e}")
            return "Always verify the receiver's name before entering your UPI PIN."

    def admin_risk_summary(self, flagged_list: list) -> str:
        if not self.enabled or not flagged_list:
            return "AI summary unavailable."
            
        items = flagged_list[:10]
        summary_data = chr(10).join([
            f"User:{tx.get('username', 'Unknown')} ₹{tx.get('amount')} hr:{tx.get('hour')} loc:{tx.get('location')} prob:{tx.get('fraud_probability', 0)*100:.0f}%"
            for tx in items
        ])
        
        prompt = f"""
        Admin Briefing - Recent Flagged Transactions:
        {summary_data}
        
        Provide a 3-sentence admin briefing covering dominant fraud pattern, most triggered risk dimension, and one recommended action.
        Max 80 words. Professional tone.
        """
        
        try:
            response = self.model.generate_content(prompt, generation_config={'temperature': 0.3})
            return response.text.strip()
        except Exception as e:
            logger.warning(f"Gemini admin summary unavailable: {e}")
            return "AI summary unavailable."

    def _fallback_explanation(self, risk_factors: list) -> str:
        bullets = ""
        if risk_factors:
            for rf in risk_factors[:2]:
                bullets += f"\n- {rf.get('description')}"
        
        return f"We blocked this payment because we detected suspicious activity that doesn't match your usual patterns.{bullets}\n\nPlease verify you initiated this payment. If not, change your UPI PIN immediately."

gemini_service = GeminiService()
