
const {
  invokeClaudeStreaming,
  RetrieveAndGen,
  StartIngestionJob,
  GetIngestionJob
} = require("./methods");



exports.handler = async (event) => {

const Body = event.body ? JSON.parse(event.body) : event;

 const { 
  actionType, 
  streamCode,
  modelId, 
  maxTokens, 
  messages, 
  invokeType, 
  RetrieveAndGenParams, 
  knowledgeBaseId,
  dataSourceId, 
  ingestionJobId } = Body; 
  

  let response_output = "";
  
  try {
  

    if(actionType === 'RetrieveAndGen') {
   
      response_output = await RetrieveAndGen({RetrieveAndGenParams})
     
    } else if (actionType === 'StartIngestionJob') {
   
      response_output = await StartIngestionJob({knowledgeBaseId, dataSourceId})
      
      
    } else if (actionType === 'GetIngestionJob') {

      response_output = await GetIngestionJob({knowledgeBaseId, dataSourceId, ingestionJobId})
      
    } else {
    
      const payload = {
        "anthropic_version": "bedrock-2023-05-31", 
        "max_tokens": maxTokens,
        "messages": messages
      };
      
      const input = {
        body: JSON.stringify(payload),
        contentType: "application/json",
        accept: "application/json",
        modelId: modelId
      };
      
      
      if(invokeType === 'streaming') {
        await invokeClaudeStreaming({input, streamCode})
      }
    
  }
  
  
  
} catch (error) {
            
          console.error("Error:", error);
      
          const errorResponse = {
            statusCode: 500, 
            headers: {
               ContentType: "application/json"
            },
            body: JSON.stringify({
              message: error.message || "Generic Error",
            }),
          };
      
          return errorResponse;
  }

};
