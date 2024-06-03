### 1. Crawling
Note: You don't have to run this since output files, including intermediate ones are included in the repo.
To run the entire crawl process:
1. Open terminal
2. Navigate to root project directory(if not already there)
3. Run "sh crawl.sh"

This will take ~15 mins due to the initial crawling of raw data.


### 2. Indexing
Run 'sh index.sh' which:
1. Installs solr
2. Starts solr and create a core 'new_core'
3. Indexes data if no errors with solr


### 3. Start web server
Run 'sh start-web.sh' which:
1. Terminates any processes running on the required port 8000
2. Starts the web server on port 8000