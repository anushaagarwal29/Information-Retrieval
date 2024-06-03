import requests

json_data = {
  "add-field": {
      "name": "review",
      "type": "TextField",
      "stored": True
  },
  "add-field": {
      "name": "location",
      "type": "LatLonPointSpatialField",
      "stored": True
  },
  "add-field": {
      "name": "rating",
      "type": "TrieIntField",
      "stored": True
  },
  "add-field": {
      "name": "category",
      "type": "TextField",
      "stored": True
  },
  "add-field": {
      "name": "opening_time_range",
      "type": "DateRangeField",
      "stored": True
  }
}

headers = {'Content-type': 'application/json'}
response = requests.post('http://localhost:8983/solr/new_core/schema', json=json_data, headers=headers)

if response.status_code == 200:
    print("Field added successfully")
else:
    print("Error:", response.text)