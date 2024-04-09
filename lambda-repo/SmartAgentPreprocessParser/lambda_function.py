import json
import re

"""
{'agent': {'alias': 'TSTALIASID', 'id': 'WZGKEJXPKP', 'name': 'SmartAgent', 'version': 'DRAFT'}, 'invokeModelRawResponse': ' 
<thinking>\nThe user is asking for the best performing stocks in the Japanese market over the past month to potentially invest in. This seems to be a reasonable information 
request that could potentially be answered by the function calling agent if it is able to gather the necessary information from the allowed functions or by asking 
follow-up questions using the askuser function.\n\nI do not see any evidence that this input falls into categories A, B, C, or E. 
It appears to be a straightforward information request (category D) that the function calling agent may be able to assist with using the tools it has access to.\n
</thinking>\n\n<category>D</category>', 'messageVersion': '1.0', 'overrideType': 'OUTPUT_PARSER', 'promptType': 'PRE_PROCESSING'}

{'agent': {'alias': 'TSTALIASID', 'id': 'WZGKEJXPKP', 'name': 'SmartAgent', 'version': 'DRAFT'}, 'invokeModelRawResponse': '\nThe user has asked: "ceh cos\'è un gabbiano?"\n\nThis 
is a question asking what a seagull is. The user wants a definition or description of a seagull.\n\nTo answer this, I will:\n\n1. 
Ask the user if I can perform a web search to find more information on what a seagull is. \n\n2. If the user agrees, I will search the web using relevant keywords like 
"seagull definition" and "what is a seagull".\n\n3. Analyze the search results to find the most relevant and helpful information to define or describe what a seagull is. \n\n4. 
Provide that description to the user within answer tags.\n\n</scratchpad>\n\n<function_calls>\n  <invoke>\n    <tool_name>user::askuser</tool_name>\n    <parameters>\n      
<question>Posso eseguire una ricerca sul web per trovare maggiori informazioni su cosa sia un gabbiano?</question>\n    
</parameters>\n  ', 'messageVersion': '1.0', 'overrideType': 'OUTPUT_PARSER', 'promptType': 'ORCHESTRATION'}


"""


def lambda_handler(event, context):
    

    invokeModelRawResponse = event['invokeModelRawResponse']
    
    categPatt = r'<category>(.*?)</category>'
    matchesPatt = re.findall(categPatt, invokeModelRawResponse)
    category = matchesPatt[0]

    
 
    
    if category == "C":
        response = {
        "messageVersion": '1.0.0',
         "promptType": "PRE_PROCESSING", 
         "preProcessingParsedResponse": { 
         "isValidInput": True,
         "rationale": "The question is qualified in the category D, and i will invoke the function GET::GenericQuestionToModel::askToModel",
         }}
         
    else:
        
        response = {
         "messageVersion": '1.0.0',
         "promptType": "PRE_PROCESSING", 
         "preProcessingParsedResponse": { 
         "isValidInput": True,
         "rationale": invokeModelRawResponse,
         }}
    

    return response 


