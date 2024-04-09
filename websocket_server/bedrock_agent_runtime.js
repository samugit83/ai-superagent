
const { BedrockAgentRuntimeClient, InvokeAgentCommand } = require("@aws-sdk/client-bedrock-agent-runtime"); 

const client = new BedrockAgentRuntimeClient({region: 'us-west-2'});

//https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/client/bedrock-agent-runtime/command/InvokeAgentCommand/

exports.invokeAgent = async ({agentId, agentAliasId, sessionId, endSession, enableTrace, inputText, StreamCode, io}) => {

    try {

        const input = { 
            agentId: agentId, 
            agentAliasId: agentAliasId, 
            endSession: endSession,
            enableTrace: enableTrace,
            inputText: inputText, 
            sessionId: sessionId
        };
        
        
      const command = new InvokeAgentCommand(input);
      let response = await client.send(command);

    
    
      for await (const item of response.completion) {

        if(item.trace) {

            let resp_message = {
                stream_type: 'agent',
                end_stream: false,
                response_trace: item.trace }

                io.emit(StreamCode, resp_message)

        } else if (item.chunk) {

            let chunk = Buffer.from(item.chunk.bytes).toString('utf-8')

            let resp_message = {
                stream_type: 'agent',
                end_stream: true,
                response_chunk: chunk }

                io.emit(StreamCode, resp_message)

        }


        }
  
    } catch (err) {
      console.error(err);
    }

}

