require('dotenv').config();
const express = require('express');
const http = require("http");
const bodyParser = require("body-parser");
const {Server} = require("socket.io");
const cors = require("cors")
const axios = require("axios");
const {invokeAgent} = require('./bedrock_agent_runtime.js')

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})


app.use(cors());
app.use(bodyParser.json());

io.on("connection", (socket) => {
    console.log("A user is connected");

        socket.on("new_chat_stream", (params) => {

            axios.post('https://z11416blsc.execute-api.us-west-2.amazonaws.com/default/bedrock_api', params, {
                headers: {'x-api-key': process.env.XAPIKEYBEDROCKAPI}
            }).then(results => {
            }).catch(error => {
              console.log(error); 
            });

        })

        socket.on("new_invoke_agent_stream", (params) => {

            const {agentId, agentAliasId, sessionId, endSession, enableTrace, inputText, StreamCode} = params
            invokeAgent({agentId, agentAliasId, sessionId, endSession, enableTrace, inputText, StreamCode, io});

        })

})



app.post('/api/gpt_chunks', (req, res, next) => {

    io.emit(req.body.streamCode, req.body);
    res.status(200).send('ok')

})




const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
    console.log(`Server listening on port ${5000}`)
})



