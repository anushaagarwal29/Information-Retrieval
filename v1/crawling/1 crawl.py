import praw
import csv
import os
from collections import defaultdict
from constants import POSTS_FILE_PATH, COMMENTS_FILE_PATH

reddit = praw.Reddit(client_id='7pAZGD58HtMAmcsRkfscHw',
                     client_secret='_S8S3FvUF1shHGYIxnhP60W8HqsCCQ',
                     user_agent='redditdev crawler by u/BisonAlarmed5647')

def search_and_store(subreddit_names, search_query, csv_writer_posts, csv_writer_comments):
    for subreddit_name in subreddit_names:
        print(f"Searching for '{search_query}' in r/{subreddit_name}...")
        subreddit = reddit.subreddit(subreddit_name)
        count = 0  # Initialize a counter to track the number of posts stored
        for submission in subreddit.search(search_query, limit=None):
            post_data = defaultdict(str)
            post_data['id'] = submission.id
            post_data['title'] = submission.title
            post_data['selftext'] = submission.selftext
            post_data['url'] = submission.url
            post_data['created_utc'] = submission.created_utc
            post_data['num_comments'] = submission.num_comments
            post_data['upvotes'] = submission.score
            post_data['subreddit'] = subreddit_name

            # Write the post data to the CSV
            csv_writer_posts.writerow(post_data)
            count += 1

            # Fetch and store comments for the post
            submission.comments.replace_more(limit=None)
            for comment in submission.comments.list():
                if hasattr(comment, 'body'):
                        if any(keyword.lower() in comment.body.lower() for keyword in base_keywords):
                                comment_data = {
                                    'post_id': submission.id,  # post_id
                                    'comment_text': comment.body,
                                    'author': comment.author.name if comment.author else None,
                                    'created_utc': comment.created_utc
                                }

                                comment_data = defaultdict(str)
                                comment_data['post_id'] = submission.id
                                comment_data['comment_text'] = comment.body
                                comment_data['author'] = comment.author.name if comment.author else None
                                comment_data['created_utc'] = comment.created_utc

                                csv_writer_comments.writerow(comment_data)


        print(f"Stored {count} posts from r/{subreddit_name} for query '{search_query}'.")

os.makedirs('raw', exist_ok=True)
post_output_path = os.path.join('raw', os.path.basename(POSTS_FILE_PATH))
comments_output_path = os.path.join('raw', os.path.basename(COMMENTS_FILE_PATH))

with open(post_output_path, 'a', newline='', encoding='utf-8') as file_posts, open(comments_output_path, 'a', newline='', encoding='utf-8') as file_comments:
    fieldnames_posts = ['id', 'title', 'selftext', 'url', 'created_utc', 'num_comments', 'upvotes', 'subreddit']
    fieldnames_comments = ['post_id', 'comment_text', 'author', 'created_utc']

    csv_writer_posts = csv.DictWriter(file_posts, fieldnames=fieldnames_posts)
    csv_writer_comments = csv.DictWriter(file_comments, fieldnames=fieldnames_comments)

    # Do not rewrite the header if appending to the file
    if file_posts.tell() == 0:  # Checks if the file is empty
        csv_writer_posts.writeheader()
    if file_comments.tell() == 0:  # Checks if the file is empty
        csv_writer_comments.writeheader()

    # Starting message
    print("Script started...")

    # Subreddits to target and keywords
    subreddit_names = [
                         'telecommuting'
                       , 'remotework'
                       , 'WorkOnline'
                       , 'WFH'
                       , 'work'
                       , 'antiwork'
                       , 'overemployed'
                       , 'careerguidance'
                       , 'careeradvice'
                       , 'jobs'
                       , 'freelance'
                       , 'workreform'
                       , 'productivity'
                       , 'nostupidquestions'
                       , 'changemyview'
                       , 'doesanybodyelse'
                      ]
    base_keywords = [
                       'remote work'
                     , 'telecommuting'
                     , 'work from home'
                     , 'wfh'
                     , 'working remotely'
                     , 'home office'
                     , 'remote jobbing'
                     , 'telejobbing'
                     , 'working from home'
                     , 'work at home'
                    ]

    # Generate search queries dynamically
    search_queries = [' OR '.join([f'title:{keyword}' for keyword in base_keywords])]

    # Perform searches and store results in CSV for each subreddit
    for search_query in search_queries:
        search_and_store(subreddit_names, search_query, csv_writer_posts, csv_writer_comments)

    # Completion message
    print("Script completed successfully.")
