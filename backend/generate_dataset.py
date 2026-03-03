import pandas as pd
import numpy as np
from tqdm import tqdm
import random
import os

# Set seed for reproducibility
np.random.seed(42)
random.seed(42)

def generate_dataset():
    num_users = 1000
    avg_tx_per_user = 120
    
    data = []
    
    print(f"Generating synthetic dataset for {num_users} users...")
    
    for user_id in tqdm(range(num_users)):
        # User profile
        usual_location = random.randint(0, 4)
        avg_amount = random.uniform(200, 8000)
        # Active hour window (7-hour block between 7AM and 11PM)
        start_hour = random.randint(7, 16) 
        end_hour = start_hour + 7
        
        num_tx = int(np.random.normal(avg_tx_per_user, 10))
        
        for seq in range(num_tx):
            is_fraud = random.random() < 0.10
            
            if not is_fraud:
                # Normal transaction
                amount = np.random.normal(avg_amount, avg_amount * 0.25)
                location = usual_location if random.random() < 0.88 else random.randint(0, 4)
                
                # Time within active window 90% of time
                if random.random() < 0.90:
                    hour = random.randint(start_hour, end_hour) % 24
                else:
                    hour = random.randint(0, 23)
                
                time_gap = random.uniform(0.5, 48) # Hours
            else:
                # Fraud transaction (3 patterns)
                pattern = random.random()
                if pattern < 0.60:
                    # Pattern 1: Large amount
                    amount = avg_amount * random.uniform(2.5, 6.0)
                elif pattern < 0.85:
                    # Pattern 2: Burst attack
                    amount = np.random.normal(avg_amount, avg_amount * 0.25)
                    time_gap = random.uniform(0, 0.25) # Under 15 mins
                else:
                    # Pattern 3: Round-number amounts
                    amount = random.choice([499, 999, 4999, 9999, 19999])
                
                # For all fraud: 80% chance of unusual location
                if random.random() < 0.80:
                    location = random.choice([l for l in range(5) if l != usual_location])
                else:
                    location = usual_location
                
                # Hour could be anytime for fraud
                hour = random.randint(0, 23)
                
                if 'time_gap' not in locals():
                    time_gap = random.uniform(0.1, 24)

            # Clean up values
            amount = max(1, round(amount, 2))
            time_gap = round(time_gap, 4)
            
            data.append({
                'user_id': user_id,
                'transaction_seq': seq,
                'amount': amount,
                'hour': hour,
                'time_gap': time_gap,
                'location': location,
                'fraud': 1 if is_fraud else 0
            })
            
    df = pd.DataFrame(data)
    
    # Save to CSV
    output_path = 'upi_fraud_dataset.csv'
    df.to_csv(output_path, index=False)
    
    print(f"Dataset saved to {output_path}")
    print(f"Total rows: {len(df)}")
    print(f"Fraud count: {df['fraud'].sum()}")
    print(f"Fraud percentage: {(df['fraud'].sum() / len(df) * 100):.2f}%")
    
    return df

if __name__ == "__main__":
    generate_dataset()
