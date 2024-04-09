const {
    AccessDeniedException,
    BedrockRuntimeClient,
    InvokeModelWithResponseStreamCommand,
} = require("@aws-sdk/client-bedrock-runtime");
const { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand } = require("@aws-sdk/client-bedrock-agent-runtime") 
const { BedrockAgentClient, StartIngestionJobCommand, GetIngestionJobCommand } = require("@aws-sdk/client-bedrock-agent")


const http = require("http");

const BedrockRuntimeCli = new BedrockRuntimeClient({ region: "us-west-2" });
const BedrockAgentRuntimeCli = new BedrockAgentRuntimeClient({ region: "us-west-2" });
const BedrockAgentCli = new BedrockAgentClient({ region: "us-west-2" });



const newRequest = async (opts) => {

    return new Promise((resolve, reject) => {
        let req = http.request(opts, function (res) {
            let body = ''
            res.on('data', (chunk) => { body += chunk })
            res.on('end', () => { resolve(body) })
            
        })
        req.write(opts.body) //se la chiamata è di tipo post
        req.end()
    })

}
    



exports.invokeClaudeStreaming = async ({input, streamCode}) => {
    
    
    const command = new InvokeModelWithResponseStreamCommand(input);
    
    try {
        
        const response = await BedrockRuntimeCli.send(command)
        
        let chunk_word_length = 30;
        
        let counter = 0;
        let string = "";
        
        for await (const item of response.body) {
            
            let chunk = Buffer.from(item.chunk.bytes).toString('utf-8');
            let json_chunk = JSON.parse(chunk)
            
            if(json_chunk?.delta?.text) {
                
                string += json_chunk?.delta?.text;
                counter++
               
                
                if(counter > chunk_word_length) {
                         
                    let options = {
                            host: '<your server ip>', 
                            port: 5000,
                            path: '/api/gpt_chunks',
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({streamCode: streamCode, 
                                                  stream_type: 'model',
                                                  response_chunk: string}) 
                    };
    
                    await newRequest(options)
                    
                    counter = 0
                    string = ""

                }
                
                                    
             
          
             }
            }

            
            let options = {
                            host: '<your server ip>', 
                            port: 5000,
                            path: '/api/gpt_chunks',
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({streamCode: streamCode, 
                                                  stream_type: 'model',
                                                  response_chunk: string,
                                                  end_stream: true
                            }) 
            };
    
            await newRequest(options)
            

            
            
    } catch (err) {
            console.error(err)
    }
 
    
}


exports.RetrieveAndGen = async ({RetrieveAndGenParams}) => {
    
    const command = new RetrieveAndGenerateCommand(RetrieveAndGenParams);
    const response = await BedrockAgentRuntimeCli.send(command);
    
    return response
    
}


exports.StartIngestionJob = async ({knowledgeBaseId, dataSourceId}) => {
  
  const params = { 
    knowledgeBaseId: knowledgeBaseId, 
    dataSourceId: dataSourceId
  };
  
  
  const command = new StartIngestionJobCommand(params);
  const response = await BedrockAgentCli.send(command);
  
  return response

};


exports.GetIngestionJob = async ({knowledgeBaseId, dataSourceId, ingestionJobId}) => {
  
    
  const params = { 
    knowledgeBaseId: knowledgeBaseId, 
    dataSourceId: dataSourceId,
    ingestionJobId: ingestionJobId
  };
  
  
  const command = new GetIngestionJobCommand(params);
  const response = await BedrockAgentCli.send(command);
  
  return response

};
    
  






