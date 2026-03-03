import pandas as pd
import numpy as np

# Create a sample transaction file for testing
data = {
    'amount': [500, 1200, 50000, 100, 8500],
    'location': [0, 1, 4, 0, 2],
    'hour': [10, 14, 2, 11, 19]
}

df = pd.DataFrame(data)
df.to_csv('sample_transactions.csv', index=False)
print("sample_transactions.csv created!")
