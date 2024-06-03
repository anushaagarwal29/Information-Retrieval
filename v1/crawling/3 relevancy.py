import pandas as pd
from textblob import TextBlob
from constants import COMBINED_FILE_PATH, FINAL_FILE_PATH, EVAL_FILE_PATH

# Step 1: Read the Excel file
file_path = COMBINED_FILE_PATH
comments_df = pd.read_csv(file_path)

# Step 2: Define the functions for sentiment analysis and relevance classification
def categorize_sentiment(comment):
    analysis = TextBlob(comment)
    return 'Positive' if analysis.sentiment.polarity > 0 else 'Negative'

# Define keywords related to remote work
remote_work_keywords = [
    'remote', 'work from home', 'telecommute', 'virtual', 'online',
    'distributed team', 'zoom', 'slack', 'teams', 'video conferencing',
    'home office', 'teleworking' , 'wfh', 'working from home', 'working at home', 'work at home'
]

def classify_remote_work_relevance(comment):
    if any(keyword in comment.lower() for keyword in remote_work_keywords):
        return 'Useful for Remote Work'
    else:
        return 'Not Useful for Remote Work'

# Step 3: Apply the functions
comments_df['Sentiment'] = comments_df['Text'].apply(categorize_sentiment)
comments_df['Remote Work Relevance'] = comments_df['Text'].apply(classify_remote_work_relevance)

# Step 4: Filter for relevance
relevant_comments_df = comments_df[comments_df['Remote Work Relevance'] == 'Useful for Remote Work']

# Step 5: Balance the number of positive and negative comments
positive_df = relevant_comments_df[relevant_comments_df['Sentiment'] == 'Positive']
negative_df = relevant_comments_df[relevant_comments_df['Sentiment'] == 'Negative']
min_count = min(len(positive_df), len(negative_df))

balanced_df = pd.concat([positive_df.sample(min_count), negative_df.sample(min_count)])

# Step 6: Check for the number of rows requirement
if len(balanced_df) < 10000:
    print(f"The number of relevant comments is below 10,000. It's currently {len(balanced_df)}.")
    # You may need to reconsider your filters or add more data to meet the row requirement.
else:
    print(f"The number of relevant comments is sufficient: {len(balanced_df)}.")
    
    # Step 7: Check for the word count requirement
    total_word_count = balanced_df['Text'].str.split().str.len().sum()
    if total_word_count < 100000:
        print(f"Total word count is below 100,000. It's currently {total_word_count}.")
        # You may need to reconsider your filters or add more data to meet the word count requirement.
    else:
        print(f"Total word count is sufficient: {total_word_count}.")

        # Need both excel and 
        balanced_df.to_excel(EVAL_FILE_PATH, index=False)
        balanced_df.to_json(FINAL_FILE_PATH, orient='records')
        print(f"Analysis completed. Balanced and relevant results saved to: {FINAL_FILE_PATH} with a total word count of: {total_word_count}.")
