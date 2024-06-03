# Assume macOS
brew install solr

# Terminate any processes running on the required port 8983
lsof -ti :8983 | xargs kill -9

printf "Startin solr instance...\n"
/opt/homebrew/opt/solr/bin/solr start

status=$( /opt/homebrew/opt/solr/bin/solr status | grep -o 'running on port' )

# If not 'running' exit
if [[ -z $status ]]; then
    printf "Solr instance failed to start.\n"
    exit 1
fi

alreadyExists=$(/opt/homebrew/opt/solr/bin/solr create_core -c new_core 2>&1)
if [[ $alreadyExists == *"already exists"* ]]; then
    printf "new_core already exists, recreating new_core\n"
    /opt/homebrew/opt/solr/bin/solr delete -c new_core
    /opt/homebrew/opt/solr/bin/solr create_core -c new_core
fi

printf "Creating schema...\n"
python3 create_schema.py
printf "Finished creating schema.\n"

printf "Running post_to_solr.py...\n"
python3 post_to_solr.py
printf "Finished running post_to_solr.py\n"