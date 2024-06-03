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

printf "Creating config...\n"
curl -X POST -H 'Content-Type: application/json' --data-binary '{
  "update-searchcomponent": {
    "name": "spellcheck",
    "class": "solr.SpellCheckComponent",
    "spellchecker": {
      "name": "default",
      "field": "_text_",
      "classname": "solr.DirectSolrSpellChecker",
      "distanceMeasure": "internal",
      "accuracy": 0.5,
      "maxEdits": 2,
      "minPrefix": 1,
      "maxInspections": 5,
      "minQueryLength": 4,
      "maxQueryLength": 40,
      "maxQueryFrequency": 0.01,
      "thresholdTokenFrequency": 0.01
    }
  },
  "update-requesthandler": {
    "name": "/select",
    "class": "solr.SearchHandler",
    "defaults": {
      "echoParams": "explicit",
      "rows": 10,
      "spellcheck": true,
      "df": "_text_"
    },
    "last-components":["spellcheck"]
  }
}' http://localhost:8983/solr/new_core/config

printf "Created config.\n"

curl http://localhost:8983/solr/new_core/config/params -X POST -H 'Content-type:application/json' --data-binary '{
  "set": {
    "dismax":{
      "defType":"dismax",
      "qf":"ReviewNormalized^1 RestaurantNameNormalized^2",
      "mm":"75%"
    }
  }
}'

printf "Creating schema...\n"
curl -X POST -H 'Content-Type: application/json' --data-binary '{
  "add-field-type" : {
    "name":"Normalized_Text",
    "class":"solr.TextField",
    "analyzer": {
      "tokenizer": {
        "class": "solr.NGramTokenizerFactory"
      },
      "filters": [
        { "class": "solr.LowerCaseFilterFactory" },
        { "class": "solr.StopFilterFactory", "ignoreCase": true }
      ]
    }
  },
  "add-field-type": {
    "name": "Location",
    "class": "solr.LatLonPointSpatialField",
    "indexed": true
  },
  "add-field": {
    "name": "RestaurantName",
    "type": "string",
    "stored": true
  },
  "add-field": {
    "name": "RestaurantNameNormalized",
    "type": "Normalized_Text",
    "stored": true
  },
  "add-field": {
    "name": "Rating",
    "type": "pfloat",
    "stored": true
  },
  "add-field": {
    "name": "RestaurantRating",
    "type": "pfloat",
    "stored": true
  },
  "add-field": {
    "name": "Review",
    "type": "text_general",
    "stored": true,
    "indexed": true,
  },
  "add-field": {
    "name": "ReviewNormalized",
    "type": "Normalized_Text",
    "stored": true,
    "indexed": true,
  },
  "add-field": {
    "name": "FormattedAddress",
    "type": "string",
    "stored": true
  },
  "add-field": {
    "name": "PlaceId",
    "type": "string",
    "stored": true
  },
  "add-field": {
    "name": "Types",
    "type": "strings",
    "multiValued": true
  },
  "add-field": {
    "name": "LatLng",
    "type": "Location",
    "indexed": true,
    "stored": true,
    "docValues": true
  },
  "add-field": {
    "name": "Label",
    "type": "string",
    "stored": true
  },
  "add-copy-field" : {"source":"*","dest":"_text_"},
  "add-copy-field": {
    "source": "RestaurantName",
    "dest": "RestaurantNameNormalized"
  },
  "add-copy-field": {
    "source": "Review",
    "dest": "ReviewNormalized"
  },
}' http://localhost:8983/solr/new_core/schema


printf "Finished creating schema.\n"

printf "Running post_to_solr.py...\n"
python3 post_to_solr.py
printf "Finished running post_to_solr.py\n"