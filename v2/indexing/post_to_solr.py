
import requests

def post_json_to_solr(json_file_path, solr_core_url):
    # Read the JSON content from the file
    with open(json_file_path, 'r') as file:
        json_data = file.read()
    
    # Define the headers for the HTTP request
    headers = {'Content-type': 'application/json'}
    
    # Make the POST request to Solr's update API
    response = requests.post(solr_core_url, data=json_data, headers=headers)
    
    # Check for the response status code
    if response.status_code == 200:
        print("Data successfully posted to Solr.")
    else:
        print(f"Failed to post data to Solr. Status code: {response.status_code}, Response: {response.text}")

# Replace with your actual JSON file path and Solr core URL
json_file_path = '../crawling/final-v3.json'
solr_core_url = 'http://localhost:8983/solr/new_core/update?commit=true'

# Call the function to post the data to Solr
post_json_to_solr(json_file_path, solr_core_url)
