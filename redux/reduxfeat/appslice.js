import {createSlice} from '@reduxjs/toolkit'
import {models_obj} from '@/app/gpt_models.js'

export const appSlice = createSlice({
    name: 'app',
    initialState: {
        ChatContent: [],
        SelectedModel: models_obj[0],
        AgentTraces: "",
        SessionIDChatKnowledgeBase: null,
        SessionIDAgent: null,
        TrainingMessage: "",
        TrainingStatus: "sleep",
        UploadingProgress: [0, ""],
        AlertPopupMessage: null
    },
    reducers: { 
        push_NewMessageInStreamingChat: (state, action) => {
            let ActiveStream = state.ChatContent.find(item => item.StreamCode === action.payload.StreamCode)

            if(ActiveStream && action.payload.StreamCode) {
                ActiveStream.prompt += action.payload.prompt
            } else {
                state.ChatContent = [...state.ChatContent, action.payload]
            }
        },
        push_NewMessageInChatKnowledgeBase: (state, action) => {
            let newChatContent 
            if(action.payload.member === 'assistant' && action.payload.prompt) {
              newChatContent = state.ChatContent.filter(item => item.prompt)
            } else {
              newChatContent = state.ChatContent
            }
            state.ChatContent = [...newChatContent, action.payload]
        },
        update_SessionIDChatKnowledgeBase: (state, action) => {
            state.SessionIDChatKnowledgeBase = action.payload
          },
        update_SelectedModel: (state, action) => {
            state.SelectedModel = action.payload
        },
        reset_Chat: (state) => {
            state.ChatContent = []
            state.AgentTraces = ""
            state.SessionIDChatKnowledgeBase = null
            state.SessionIDChatKnowledgeBase = null
        },
        update_TrainingStatus: (state, action) => {
            state.TrainingStatus = action.payload
        },
        update_UploadingProgress: (state, action) => {
            state.UploadingProgress = action.payload
        },
        update_AlertPopupMessage: (state, action) => {
            state.AlertPopupMessage = action.payload
        },
        update_TrainingMessage: (state, action) => {
            state.TrainingMessage = action.payload
        },
        update_SessionIDAgent: (state, action) => {
            state.SessionIDAgent = action.payload
        },
        push_AgentTrace: (state, action) => {
            state.AgentTraces = state.AgentTraces + action.payload
          },
    }

})

export const {
    push_NewMessageInStreamingChat,
    update_SelectedModel,
    reset_Chat,
    update_UploadingProgress,
    update_TrainingStatus,
    update_AlertPopupMessage,
    update_TrainingMessage,
    push_NewMessageInChatKnowledgeBase,
    update_SessionIDChatKnowledgeBase,
    update_SessionIDAgent,
    push_AgentTrace
} = appSlice.actions

export default appSlice.reducer