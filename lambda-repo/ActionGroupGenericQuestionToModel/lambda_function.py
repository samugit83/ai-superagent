import json
import boto3
from botocore.exceptions import ClientError  

""" input event
{'messageVersion': '1.0', 'actionGroup': 'GenericQuestionToModel', 'agent': {'alias': 'TSTALIASID', 'name': 'SmartAgent', 'version': 'DRAFT', 'id': 'WZGKEJXPKP'}, 
'inputText': 'elencami 10 animali in via di estinsione', 'apiPath': '/askToModel', 'sessionId': '897988431261989', 'sessionAttributes': {}, 'promptSessionAttributes': {}, 
'httpMethod': 'GET', 'parameters': [{'name': 'userQuestion', 'type': 'string', 'value': 'elencami 10 animali in via di estinsione'}]}

"""


def lambda_handler(event, context):
    
    parameters = event['parameters']
    inputText = event['inputText']
    
    inputText = "Please provide a answer without requesting further details, even if all the necessary information is not available, as I will be posing a single question. This is the question: " + inputText 

    modelResp = invoke_claude_3_with_text(inputText)
    Answer = modelResp['content'][0]['text']


    response = {
        'messageVersion': '1.0.0',
        'response': {
            'actionGroup': 'GenericQuestionToModel',
            'apiPath': '/askToModel',
            'httpMethod': 'get',
            'httpStatusCode': 200,
            'responseBody': {
                'application/json': {
                    'body': json.dumps({'Answer': Answer})
                }
            },
            'sessionAttributes': {},
            'promptSessionAttributes': {}
        }
    }

    return response 






def invoke_claude_3_with_text(prompt):

        client = boto3.client(
            service_name="bedrock-runtime", region_name="us-west-2"
        )

        model_id = "anthropic.claude-3-sonnet-20240229-v1:0"   #anthropic.claude-3-sonnet-20240229-v1:0  #anthropic.claude-v2

        try:
            response = client.invoke_model(
                modelId=model_id,
                body=json.dumps(
                    {
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 1000,  
                        "messages": [
                            {
                                "role": "user",
                                "content": [{"type": "text", "text": prompt}],
                            }
                        ],
                    }
                ),
            )

            result = json.loads(response.get("body").read())
            input_tokens = result["usage"]["input_tokens"]
            output_tokens = result["usage"]["output_tokens"]
            output_list = result.get("content", [])
            
            """
            print("Invocation details:")
            print(f"- The input length is {input_tokens} tokens.")
            print(f"- The output length is {output_tokens} tokens.")
            print(f"- The input string length is {len(prompt)} chars.")

            print(f"- The model returned {len(output_list)} response(s):")
            
            
            for output in output_list:
                print(output["text"])
            """

            return result

        except ClientError as err:
            print(
                "Couldn't invoke Claude 3 Sonnet. Here's why: %s: %s",
                err.response["Error"]["Code"],
                err.response["Error"]["Message"],
            )
            raise
        
