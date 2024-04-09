'use client'

import {useRef, useEffect, useState} from 'react';
import io from 'socket.io-client';
import crypto from 'crypto';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUserAstronaut, faUser, faTrashCanArrowUp, faBrain } from '@fortawesome/free-solid-svg-icons'
import { MutatingDots } from  'react-loader-spinner';
import {useSelector, useDispatch} from 'react-redux';
import {
  reset_Chat, 
  push_NewMessageInStreamingChat, 
  update_TrainingStatus,
  update_UploadingProgress,
  update_AlertPopupMessage,
  update_TrainingMessage,
  push_NewMessageInChatKnowledgeBase,
  update_SessionIDChatKnowledgeBase,
  update_SessionIDAgent,
  push_AgentTrace
} from '@/redux/reduxfeat/appslice';
import GptModels from '@/app/gpt_models'
import { Input, notification, Tooltip } from 'antd';
import TrainingWindow from './training_window';
import {multiPartUpload} from './multipartupload'
import {fetchCall} from '@/server_actions/fetching'
import {ThreeDots} from  'react-loader-spinner';
import Prism from "prismjs";
import "./prism.css";
import 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace';
import 'prismjs/components/prism-json'

const {TextArea} = Input;


export default function ChatComp() {

    const StreamCode = useRef()
    const [endStream, setEndStream] = useState(true)
    const [inputValue, setInputValue] = useState('');
    const [TrainingFiles, setTrainingFiles] = useState([])
    const [tracesIsVisible, setTracesIsVisible] = useState(false)

    const socket = io('http://35.152.48.166:5000')
    const SelectedModel = useSelector((state) => state.app.SelectedModel)
    const ChatContent = useSelector((state) => state.app.ChatContent)
    const TrainingStatus = useSelector((state) => state.app.TrainingStatus)
    const AlertPopupMessage = useSelector((state) => state.app.AlertPopupMessage)
    const SessionIDChatKnowledgeBase = useSelector((state) => state.app.SessionIDChatKnowledgeBase)
    const SessionIDAgent = useSelector((state) => state.app.SessionIDAgent)
    const AgentTraces = useSelector((state) => state.app.AgentTraces)
    const chatContainerRef = useRef(null)
    const tracesContainerRef = useRef(null);
    const superscript_on = true;

    
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
          setTimeout(() => {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
          }, 0);
        }
    };

    const scrollToBottomTraces = () => {
      if (tracesContainerRef.current) {
        setTimeout(() => {
          tracesContainerRef.current.scrollTop = tracesContainerRef.current.scrollHeight;
        }, 0);
      }
    };



    const dispatch = useDispatch()

    useEffect(() => {

      socket.on(StreamCode.current, (chunk) => {

          if(!StreamCode.current){return;}
          if(chunk.end_stream){setEndStream(true)}

          if(chunk.response_chunk) {
            dispatch(push_NewMessageInStreamingChat({
                member: 'assistant',
                prompt: chunk.response_chunk,
                StreamCode: StreamCode.current
            }));
          }

          if (chunk.stream_type === 'agent' && chunk.response_trace) {

            dispatch(push_AgentTrace(JSON.stringify(chunk.response_trace, null, 2)));
            scrollToBottomTraces()

          }

          scrollToBottom();

      });

      Prism.highlightAll();

      Prism.plugins.NormalizeWhitespace.setDefaults({
        'break-lines': 60
      });

      return () => {
          socket.off(StreamCode.current);
      }

  }, [StreamCode.current])


    
    useEffect(() => {
      const openNotification = () => {

        notification['warning']({
          message: '',
          description:
          AlertPopupMessage,
          placement: 'topRight'});
      };

      if(AlertPopupMessage){
        openNotification()
      }
  
    }, [AlertPopupMessage]);

    
    useEffect(() => {

      Prism.highlightAll();

      Prism.plugins.NormalizeWhitespace.setDefaults({
        'break-lines': 60
      });

    }, [AgentTraces]);
    
    
    const showTraces = () => {
      setTracesIsVisible(!tracesIsVisible)
    }

    const handleResetChat = () => {
        dispatch(reset_Chat())
        setEndStream(true)
        socket.off(StreamCode.current)
        StreamCode.current = null
    };

    const handleChange = e => {
        setInputValue(e.target.value)
    }

    const handleEnterPress = async (e) => {
        e.preventDefault()

        if(SelectedModel.key === "godmode") {
            StreamCode.current = crypto.randomBytes(32).toString('hex')
            setEndStream(false)

            if(inputValue.trim() !== '') {
                dispatch(push_NewMessageInStreamingChat(
                    {member: 'user',
                     prompt: inputValue}
                ));
                setInputValue('');
                scrollToBottom();

                dispatch(push_NewMessageInStreamingChat(
                    {member: 'assistant',
                     prompt: '',
                     StreamCode: StreamCode.current}
                ));
                scrollToBottom();

                let params = {
                    streamCode: StreamCode.current,
                    modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
                    maxTokens: 4000,
                    messages: [...ChatContent, {"member": 'user', "prompt": inputValue}].filter(itm => itm.prompt).map(itm => {return {"role": itm.member, "content": itm.prompt}}),
                    invokeType: "streaming"  
                }

                socket.emit('new_chat_stream', params)
    
            }

        } else if (SelectedModel.key === 'knowledgebase') {

          if (inputValue.trim() !== '') {

          scrollToBottom()
          dispatch(push_NewMessageInChatKnowledgeBase({
              member: 'user',
              prompt: inputValue
          }));
          scrollToBottom();

          setInputValue(''); 
          
          dispatch(push_NewMessageInChatKnowledgeBase({
              member: 'assistant',
              prompt: '',
          }));
          scrollToBottom();
   
          const params = {
            actionType: 'RetrieveAndGen',
            RetrieveAndGenParams: {
              input: { 
                text: inputValue
              },
              retrieveAndGenerateConfiguration: { 
                knowledgeBaseConfiguration: { 
                    knowledgeBaseId: SelectedModel.knowledgeBaseId,
                    modelArn: "arn:aws:bedrock:us-west-2::foundation-model/anthropic.claude-v2"
                },
                type: "KNOWLEDGE_BASE"
              }
            }}


            if(SessionIDChatKnowledgeBase){
              params.RetrieveAndGenParams.sessionId = SessionIDChatKnowledgeBase
            }

            let url = 'https://z11416blsc.execute-api.us-west-2.amazonaws.com/default/bedrock_api'
            let result = await fetchCall(params, url)


          if(result?.citations) {

              dispatch(push_NewMessageInChatKnowledgeBase({
                member: 'assistant',
                prompt: (
                  result.citations.map((item, idx) => {
                    return  <span key={idx.toString()} style={{display: 'flex'}}>
                              {`${item.generatedResponsePart.textResponsePart.text.replace('\r', '\n').replace(/\(.*?risultat.*?\)/g, '')}`}
                              {item.retrievedReferences.map((refer, index) => {
                                return  <span key={'a'+index.toString()}>
                                          {superscript_on ?
                                          <Tooltip color={"#C8C8C8"} overlayStyle={{maxWidth: '500px'}} placement='right' title={refer.content.text}>
                                                 <span className="page_gpt-superscript">{`[${index + 1}]`}</span>
                                          </Tooltip>  
                                          :
                                          ''
                                          }
                                        </span>
                              })}
                              {'\n'}
                            </span>
                      })

                  )
              }));

          } else {

            dispatch(push_NewMessageInChatKnowledgeBase({
              member: 'assistant',
              prompt: 'Ops, went wrong'
            }))

          };



          scrollToBottom();

          dispatch(update_SessionIDChatKnowledgeBase(result.sessionId))

        }
      } else if (SelectedModel.key === 'agenteai') {

        if (inputValue.trim() !== '') {

            let newSessionID = SessionIDAgent
            if(!newSessionID){
              newSessionID = crypto.randomBytes(32).toString('hex')
              dispatch(update_SessionIDAgent(newSessionID))
            } 

            StreamCode.current = crypto.randomBytes(32).toString('hex')
            setEndStream(false)

            dispatch(push_NewMessageInStreamingChat({
                member: 'user',
                prompt: inputValue,
  
            }));
            setInputValue(''); 
            scrollToBottom();
            
            dispatch(push_NewMessageInStreamingChat({
                member: 'assistant',
                prompt: '',
                StreamCode: StreamCode.current
            }));
            scrollToBottom();

            const params = { 
              agentId: SelectedModel.agentId, 
              agentAliasId: SelectedModel.agentAliasId, 
              endSession: false,
              enableTrace: SelectedModel.enableTrace, 
              inputText: inputValue, 
              sessionId: newSessionID,
              StreamCode: StreamCode.current

            };

            socket.emit('new_invoke_agent_stream', params)

        } 
      }

    }


    const startUploadAndTraining = async () => {

        dispatch(update_TrainingStatus('uploading'))

        const handleUploadAndTrain = (progr_array) => {
          dispatch(update_UploadingProgress(progr_array))
        }

        const handleTrainingStatus = (value) => {
          dispatch(update_TrainingStatus(value))
        }

        const genAlertPopup = (value) => {
          dispatch(update_AlertPopupMessage(value))
        }


        try {

          let success = await multiPartUpload(
            { fileArray: TrainingFiles, 
              handleUploadAndTrain, 
              handleTrainingStatus,
              genAlertPopup,
              SelectedModel})

          if(success) {
            console.log('Upload successful!');
          } else {
            console.error('Upload failed!');
          }

        } catch (error) {
          console.error('Error during upload:', error);
        }
    }


    const handleFileChange = async (e) => {
      const selectedFiles = Array.from(e.target.files);
    
      try {
        const fileContents = await Promise.all(
          selectedFiles.map((file) => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
    
              reader.onload = (event) => {
                const buffer = event.target.result;
                const uint8Array = new Uint8Array(buffer);
                resolve({ file, uint8Array });
              };
    
              reader.onerror = (error) => {
                reject(error);
              };
    
              reader.readAsArrayBuffer(file);
            });
          })
        );


        let new_message = "I proceed with the upload and training of the following files?\n\n" + fileContents.map(item => item.file.name).join("\n ")

        dispatch(update_TrainingMessage(new_message));
        dispatch(update_TrainingStatus('files_ready'));
        setTrainingFiles(fileContents)

      } catch (error) {
        console.error("Error reading files:", error);
      }
    };




    return (
        <>
          <div className={`page_gpt-main-cont ${tracesIsVisible ? 'page_gpt-main-cont-agenteai' : ''}`}>
            <div className="page_gpt-chat-cont" ref={chatContainerRef}>
                <div style={{marginLeft: '10px', marginBottom: '10px'}}>
                  <FontAwesomeIcon style={{fontSize: '22px', color: "#91ceff", marginRight: '10px'}} icon={faUserAstronaut}/>
                  {SelectedModel.welcomeMessage}
                </div>
                {ChatContent.map((item, idx) => {
                    return <div className="page_gpt-chat-message-cont" key={idx.toString()}>
                             {!item.prompt ? 
                              <MutatingDots
                                visible={true}
                                height="100"
                                width="100"
                                color="#91ceff"
                                secondaryColor="#d8a1ff"
                                radius="12.5"
                                ariaLabel="mutating-dots-loading"
                                wrapperStyle={{}}
                                wrapperClass=""
                              /> : 
                              <div className="page_gpt-chat-speach-block">
                                <FontAwesomeIcon style={{fontSize: '22px', color: "#91ceff", marginRight: '10px'}} icon={item.member === "assistant" ? faUserAstronaut : faUser}/>
                                 <div>
                                    {item.prompt}
                                 </div>
                              </div>
                             }
                           </div>
                })}
            </div>
            <div style={{display: 'flex', alignItems: 'center'}}>
                <TextArea
                 value={inputValue}
                 onChange={handleChange}
                 onPressEnter={handleEnterPress}
                 placeholder="Type here..."
                 autoSize
                 size={'large'}
                 style={{borderRadius: '20px', margin: 'auto', display: 'block'}}
                 disabled={!endStream}/>
            <FontAwesomeIcon style={{fontSize: '22px', color: "#91ceff", marginLeft: '15px', cursor: 'pointer'}} icon={faTrashCanArrowUp} onClick={handleResetChat}/>
                    {SelectedModel.key !== 'godmode' && TrainingStatus !== "uploading" && TrainingStatus !== "training"  ?
                    <>
                      <label htmlFor="file-upload">
                          <FontAwesomeIcon style={{fontSize: '26px', color: "#91ceff", marginLeft: '10px', cursor: 'pointer'}} icon={faBrain}/>
                      </label>
                      <input
                          id="file-upload"
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          style={{ display: 'none' }}
                      />
                    </>
                    : null
                  }
            </div>
            <GptModels handleresetChat={handleResetChat} />
            <TrainingWindow startUploadAndTraining={startUploadAndTraining} />
            {SelectedModel.key === "agenteai" ?
                <div className="page_gpt-icon-cont-traces">
                  <ThreeDots
                    visible={true}
                    height="100"
                    width="100"
                    color="#4fa94d"
                    radius="9"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    wrapperClass=""
                  />  
                    <div className="page_gpt-icon-cont-traces-text" onClick={showTraces}>
                      Show traces &gt;&gt;
                    </div>
                    <pre className="page_gpt-icon-cont-traces-cont" ref={tracesContainerRef} hidden={!tracesIsVisible}>
                      <code className="language-json">
                        {AgentTraces}
                      </code>
                    </pre>
                </div> 
              : null} 
          </div>
        </>
    )


}