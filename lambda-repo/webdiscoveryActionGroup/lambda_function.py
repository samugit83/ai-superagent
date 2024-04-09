import json
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import urllib.parse
from bs4 import BeautifulSoup
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from botocore.exceptions import ClientError  
import re
import time
import random


headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'}
    
def truncate_string(string, max_length):
    if len(string) > max_length:
        return string[:max_length]
    else:
        return string



def fetch_url_content(link):
    try:
        req = Request(link, headers=headers)
        with urlopen(req, timeout=4) as response:
            html = response.read()
            soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()
    except HTTPError as e:
        if e.code == 429:
            print("Received HTTP 429: Too Many Requests. Waiting and retrying...")
            return fetch_url_content(link)  # Retry the request
        else:
            return f"HTTP Error: {e.code}\n"
    except URLError as e:
        return f"URL Error: {e.reason}\n"
    except TimeoutError:
        return "Timeout Error: Request timed out\n"
    except Exception as ex:
        return f"Error occurred: {ex}\n"



""" input event
{'messageVersion': '1.0', 'actionGroup': 'WebDiscover', 'agent': {'alias': 'TSTALIASID', 'name': 'SmartAgent', 'version': 'DRAFT', 'id': 'WZGKEJXPKP'}, 
'sessionId': '897988431261931', 'sessionAttributes': {}, 'promptSessionAttributes': {}, 'inputText': 'si', 
'apiPath': '/go_search', 'httpMethod': 'GET', 'parameters': [{'name': 'searchQueries', 'type': 'array', 'value': '["andamento borsa italiana ultimi 12 mesi", "titoli azionari italiani performance anno"]'}]}
"""


delay_between_queries = 1

def lambda_handler(event, context): 

    parameters = event['parameters']
    search_queries_item = next(item for item in parameters if item['name'] == 'searchQueries')
    search_queries = json.loads(search_queries_item['value'])
    apiPath = event['apiPath'] 
    
    print(search_queries)
    
    #["migliori titoli di borsa italiana ultimi mesi", "titoli azionari italiani con migliori performance recenti"]
    #next(item for item in parameters if item['name'] == 'searchQueries')


    whole_text = ""
    
    for query in search_queries:
        
        encoded_query = urllib.parse.quote(query)
        url = f'https://www.google.com/search?q={encoded_query}&ie=utf-8&oe=utf-8&num=4'
        req = Request(url, headers=headers)
        
        #time.sleep(delay_between_queries + random.uniform(0, 1))

        try:
            html = urlopen(req)
        except HTTPError as e:
            print(f"HTTP Error: {e.code}")
            return {
                'statusCode': 500,
                'body': json.dumps('Internal Server Error')
            }

        soup = BeautifulSoup(html.read(), 'html.parser')

        allData = soup.find_all("div", {"class": "g"})

        with ThreadPoolExecutor() as executor:
            # Submit tasks to the executor
            future_to_url = {executor.submit(fetch_url_content, result.find('a').get('href')): result for result in allData}
        
            # Iterate over completed futures
            for future in as_completed(future_to_url):
                result = future_to_url[future]
                try:
                    text_content = future.result()  # Get the result of the future
                    sanitized_content = re.sub(r'[^a-zA-Z0-9\s]', '', text_content)
                    sanitized_content = re.sub(r'\s+', ' ', text_content)
                    whole_text += sanitized_content  # Accumulate the text content
                except Exception as exc:
                    print(f"{result}: {exc}") 

    whole_text = truncate_string(whole_text, 21000)
    


    response = {
        'messageVersion': '1.0.0',
        'response': {
            'actionGroup': 'WebDiscover',
            'apiPath': '/go_search',
            'httpMethod': 'get',
            'httpStatusCode': 200,
            'responseBody': {
                'application/json': {
                    'body': json.dumps({'WebContent': whole_text})
                }
            },
            'sessionAttributes': {},
            'promptSessionAttributes': {}
        }
    }

    return response 



