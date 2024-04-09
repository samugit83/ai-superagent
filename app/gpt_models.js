import godmodelogo from '../public/god-mode-logo.png';
import kblogo from '../public/kb-logo.png';
import agentlogo from '../public/agent-logo.png';
import Image from 'next/image'
import { useSelector, useDispatch } from 'react-redux'
import { update_SelectedModel } from '@/redux/reduxfeat/appslice'



export const models_obj = [

    {key: 'godmode',
     label: 'God mode',
     logo: godmodelogo,
     welcomeMessage: `Hello!
     I am a GPT language model, capable of answering a wide range of questions and performing various linguistic tasks.
     Thanks to my training on a vast amount of text from various online sources, I can provide informative answers, detailed explanations,
     write creative texts, and much more.
     How can I help you?`
    },
    {key: 'knowledgebase',
     label: 'Knowledge base',
     logo: kblogo,
     s3Bucket: 'my-knowledge-data', 
     s3folder: 'demo-knowledge-data/',
     knowledgeBaseId: 'YO1QU2QJRU',
     dataSourceId: "W7BAWOGHIZ",
     s3Region: 'us-west-2',
     supportedFormat: ['.txt', '.md', '.html', '.doc', '.docx', '.csv', '.xls', '.xlsx', '.pdf'], 
     maxFileSizeMB: 30, 
     MaxChunkSizeMB: 10,
     welcomeMessage: `Hello!
     I am an AI assistant with the ability to be trained using textual content. Thanks to the information you provide me,
     I can offer assistance on specific topics and answer your questions accurately and in detail.
     You can upload documents in formats such as txt, md, html, doc, docx, csv, xls, xlsx, and pdf to allow me to process and analyze such information and provide you with targeted responses.
     How can I help you?`
    },
    {key: 'agenteai',
     label: 'Agente AI',
     logo: agentlogo,
     agentId: 'WZGKEJXPKP', 
     agentAliasId: 'ASTIIYWGAE',
     enableTrace: true,
     s3Bucket: 'my-knowledge-data', 
     s3folder: 'demo-knowledge-data/',
     knowledgeBaseId: 'YO1QU2QJRU',
     dataSourceId: "W7BAWOGHIZ",
     s3Region: 'us-west-2',
     supportedFormat: ['.txt', '.md', '.html', '.doc', '.docx', '.csv', '.xls', '.xlsx', '.pdf'], 
     maxFileSizeMB: 30, 
     MaxChunkSizeMB: 10,
     welcomeMessage: `Hello!
     I am an advanced AI assistant offering triple functionality:
     
     1) I can conduct specific online research. Ask me to do a search and I'll start scraping relevant pages to provide you with updated and relevant information.
     
     2) I can provide answers based on the documents you've uploaded to my knowledge base. With this information, I can offer accurate solutions and insights.
     
     3) I am capable of answering general questions and solving problems of a logical, linguistic, and more nature.
     
     How can I help you?`
    }]    




const GptModels = ({handleresetChat}) => {

    const dispatch = useDispatch()

    const SelectedModel = useSelector((state) => state.app.SelectedModel)

    const handleChangeModel = (value) => {
        dispatch(update_SelectedModel(models_obj.find(item => item.key === value)))
        handleresetChat()
    }


    return (
        <div className="page_gpt-models-cont">
            {models_obj.map(item => {
                return <div key={item.key} onClick={() => handleChangeModel(item.key)}
                            className={`page_gpt-single-model ${SelectedModel.key === item.key ? 'page_gpt-single-model-selected' : ''}`}> 
                            <Image
                                src={item.logo}
                                alt={item.label}
                                sizes="100vw"
                                className="w-full"
                                style={{
                                width: '100%',
                                height: 'auto',
                                }}
                            />
                        </div>
            })
            }
        </div>

    )
};

export default GptModels;