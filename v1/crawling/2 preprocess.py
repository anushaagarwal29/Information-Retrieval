import pandas as pd
import os
from constants import POSTS_FILE_PATH, COMMENTS_FILE_PATH, COMBINED_FILE_PATH
from unidecode import unidecode

'''
  Replace symbols such as é, ç, ü with the nearest ASCII counterparts
'''
def toASCII(file_path):
  df = pd.read_csv(f"raw/{file_path}")
  df = df.applymap(lambda x: unidecode(str(x))) # transliterate Unicode characters to their closest ASCII counterparts
  os.makedirs('preprocessed', exist_ok=True)
  output_path = os.path.join('preprocessed', os.path.basename(file_path))
  df.to_csv(output_path, index=False)

toASCII(POSTS_FILE_PATH)
toASCII(COMMENTS_FILE_PATH)

posts_file_path = os.path.join('preprocessed', os.path.basename(POSTS_FILE_PATH))
comments_file_path = os.path.join('preprocessed', os.path.basename(COMMENTS_FILE_PATH))

posts_df = pd.read_csv(posts_file_path)
comments_df = pd.read_csv(comments_file_path)

data = pd.concat([posts_df['selftext'], comments_df['comment_text']], ignore_index=True).dropna()

combined_df = pd.DataFrame({'text': data})
combined_df.to_csv(COMBINED_FILE_PATH, index=False)
