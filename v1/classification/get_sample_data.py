import pandas as pd
import os

current_directory = os.getcwd()
print('cwd', current_directory)
df = pd.read_json(f'{current_directory}/crawling/final.json')
ROWS = df.shape[0]
sample_size = int(min(1000, 0.1*ROWS))
sample_df = df.sample(sample_size)

os.makedirs(f'{current_directory}/classification/raw', exist_ok=True)
sample_df.to_excel(f'{current_directory}/classification/raw/sample.xlsx', index=False, engine='openpyxl')


