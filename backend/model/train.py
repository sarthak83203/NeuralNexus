import pandas as pd
import numpy as np
import pickle
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv1D, BatchNormalization, MaxPooling1D, GlobalAveragePooling1D, Dense, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# Ensure paths are correct
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, 'upi_fraud_dataset.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'fraud_cnn.h5')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')

def train_model():
    # 1. LOAD DATA
    print(f"Loading data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    df = df.sort_values(['user_id', 'transaction_seq'])
    
    print(f"Dataset shape: {df.shape}")
    fraud_pct = (df['fraud'].sum() / len(df)) * 100
    print(f"Fraud percentage: {fraud_pct:.2f}%")
    
    # 2. BUILD SEQUENCES
    SEQ_LENGTH = 10
    X = []
    y = []
    
    print("Building sequences...")
    for user_id, group in df.groupby('user_id'):
        if len(group) < SEQ_LENGTH:
            continue
            
        # Features: amount, hour, time_gap + one-hot location (5 dims)
        # Create one-hot for location
        loc_one_hot = pd.get_dummies(group['location'], prefix='loc')
        # Ensure all 5 locations are present
        for i in range(5):
            col = f'loc_{i}'
            if col not in loc_one_hot.columns:
                loc_one_hot[col] = 0
        loc_one_hot = loc_one_hot[[f'loc_{i}' for i in range(5)]]
        
        features = pd.concat([group[['amount', 'hour', 'time_gap']], loc_one_hot], axis=1).values
        labels = group['fraud'].values
        
        for i in range(len(group) - SEQ_LENGTH + 1):
            X.append(features[i:i+SEQ_LENGTH])
            y.append(labels[i+SEQ_LENGTH-1])
            
    X = np.array(X, dtype='float32')
    y = np.array(y, dtype='float32')
    
    print(f"Final X shape: {X.shape}, y shape: {y.shape}")
    
    # 3. SCALE
    print("Scaling features...")
    # Scale amount, hour, time_gap (indices 0, 1, 2)
    scaler = StandardScaler()
    X_reshaped = X[:, :, :3].reshape(-1, 3)
    X[:, :, :3] = scaler.fit_transform(X_reshaped).reshape(X.shape[0], SEQ_LENGTH, 3)
    
    with open(SCALER_PATH, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"Scaler saved to {SCALER_PATH}")
    
    # 4. CNN ARCHITECTURE
    model = Sequential([
        Conv1D(64, kernel_size=3, activation='relu', padding='causal', input_shape=(SEQ_LENGTH, 8)),
        BatchNormalization(),
        Conv1D(128, kernel_size=3, activation='relu', padding='causal'),
        BatchNormalization(),
        MaxPooling1D(2),
        Conv1D(64, kernel_size=2, activation='relu'),
        GlobalAveragePooling1D(),
        Dense(128, activation='relu'),
        Dropout(0.4),
        Dense(64, activation='relu'),
        Dropout(0.3),
        Dense(1, activation='sigmoid')
    ])
    
    # 5. COMPILE
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC(name='auc'), 
                 tf.keras.metrics.Precision(name='precision'), 
                 tf.keras.metrics.Recall(name='recall')]
    )
    
    # 6. CLASS WEIGHTS
    class_weights = compute_class_weight('balanced', classes=np.unique(y), y=y)
    weights_dict = dict(enumerate(class_weights))
    print(f"Computed class weights: {weights_dict}")
    
    # 7. CALLBACKS
    callbacks = [
        EarlyStopping(monitor='val_auc', patience=5, restore_best_weights=True, mode='max'),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, min_lr=1e-6)
    ]
    
    # 8. TRAIN
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    print("Starting training...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=30,
        batch_size=64,
        class_weight=weights_dict,
        callbacks=callbacks,
        verbose=1
    )
    
    # 9. SAVE
    model.save(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    
    final_metrics = model.evaluate(X_val, y_val, verbose=0)
    print("\nFinal Validation Metrics:")
    for name, value in zip(model.metrics_names, final_metrics):
        print(f"{name}: {value:.4f}")

if __name__ == "__main__":
    train_model()
