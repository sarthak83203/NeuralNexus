import os
import pickle
import numpy as np
import tensorflow as tf
from config import Config
import logging

logger = logging.getLogger(__name__)

_model = None
_scaler = None

# Ensure paths are absolute relative to backend root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'fraud_cnn.h5')
SCALER_PATH = os.path.join(BASE_DIR, 'model', 'scaler.pkl')

def get_model():
    global _model
    if _model is None:
        try:
            # Use custom_objects if needed, but standard layers should be fine
            _model = tf.keras.models.load_model(MODEL_PATH)
            logger.info("CNN model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    return _model

def get_scaler():
    global _scaler
    if _scaler is None:
        try:
            with open(SCALER_PATH, 'rb') as f:
                _scaler = pickle.load(f)
            logger.info("Scaler loaded successfully")
        except Exception as e:
            logger.error(f"Error loading scaler: {e}")
            raise
    return _scaler

def prepare_sequence(recent_transactions: list, current_tx: dict) -> np.ndarray:
    """
    recent_transactions: list of up to 9 dicts
    current_tx: dict of current transaction
    returns: (1, 10, 8) shape float32 array
    """
    scaler = get_scaler()
    seq_len = Config.SEQUENCE_LENGTH # 10
    
    # Each tx dict: amount, hour, time_gap, location
    full_history = recent_transactions + [current_tx]
    
    # Take last 10
    if len(full_history) > seq_len:
        full_history = full_history[-seq_len:]
        
    feature_matrix = []
    
    # Pad with zeros if needed
    padding_needed = seq_len - len(full_history)
    for _ in range(padding_needed):
        feature_matrix.append([0.0] * 8)
        
    for tx in full_history:
        row = [
            float(tx.get('amount', 0.0)),
            float(tx.get('hour', 0.0)),
            float(tx.get('time_gap', 0.0))
        ]
        # One-hot for location (0-4)
        loc = int(tx.get('location', 0))
        loc_vec = [0.0] * 5
        if 0 <= loc < 5:
            loc_vec[loc] = 1.0
        row.extend(loc_vec)
        feature_matrix.append(row)
        
    feature_matrix = np.array(feature_matrix, dtype='float32')
    
    # Scale first 3 columns (amount, hour, time_gap)
    # Only scale where there is data (if padding with zeros, those stay zeros or get scaled)
    # The scaler expects (N, 3)
    feature_matrix[:, :3] = scaler.transform(feature_matrix[:, :3])
    
    # Return as (1, 10, 8)
    return feature_matrix.reshape(1, seq_len, 8)

def predict_fraud(recent_transactions: list, current_tx: dict) -> tuple:
    """
    Returns (is_fraud: bool, probability: float)
    """
    try:
        model = get_model()
        X = prepare_sequence(recent_transactions, current_tx)
        
        prob = float(model.predict(X, verbose=0)[0][0])
        is_fraud = prob >= Config.FRAUD_THRESHOLD
        
        return is_fraud, prob
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return False, 0.0
