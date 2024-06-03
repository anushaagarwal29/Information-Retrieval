# Information-Retrieval
Information Retrieval System with Sentiment Classification for restaurants in Sg


## Setting up project

#### Assumptions

Operating System: MacOS


#### Prequisites

Xcode and brew are installed

Python environment is installed


#### 1. Indexing Data

1. In your terminal, navigate to /v2.
2. Run 'sh index.sh'

This install solr using brew, then uses the installed solr to start solr and teardown any running instance of solr in port 8983 and re-create a core

It also creates the solr config, schema and indexes the data using Solr's REST API


#### 2. Running the web app

1. Navigate to /web
2. Run 'npm run dev'
