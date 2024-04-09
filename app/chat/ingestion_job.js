import {fetchCall} from '@/server_actions/fetching'

export const ingestionJob = async ({knowledgeBaseId, dataSourceId, handleUploadAndTrain, handleTrainingStatus, genAlertPopup}) => {

    try {

        handleTrainingStatus('training')
        handleUploadAndTrain([100, 'Training in progress, please wait...'])

        const params = {
            actionType: 'StartIngestionJob',
            knowledgeBaseId: knowledgeBaseId, 
            dataSourceId: dataSourceId
        };

        let url = 'https://z11416blsc.execute-api.us-west-2.amazonaws.com/default/bedrock_api'
        const result = await fetchCall(params, url)
        

        const ingestionJobId = (result && result.ingestionJob) ? result.ingestionJob.ingestionJobId : null


        if(!ingestionJobId){genAlertPopup("Ingestion job initialization failed.")}

        let status = (result && result.ingestionJob) ? result.ingestionJob.status : null

        if(status === 'STARTING') {

            let maxTimeMsec = 1000 * 60 * 120 
            let passedTimeMsec = 0
            let callWaitMsec = 5000


            while (status !== "COMPLETE") {

                await new Promise(resolve => setTimeout(resolve, callWaitMsec));
                passedTimeMsec += callWaitMsec

                if(passedTimeMsec > maxTimeMsec) {
                    genAlertPopup("Training failed!")
                    break;
                }

                const params = {
                    actionType: 'GetIngestionJob',
                    knowledgeBaseId: knowledgeBaseId, 
                    dataSourceId: dataSourceId,
                    ingestionJobId: ingestionJobId
                };

                const result = await fetchCall(params, url)
 
                status = (result && result.ingestionJob) ? result.ingestionJob.status : null

            };
            

        } else {
            genAlertPopup("Ingestion job initialization failed.")
        };

        if(status === "COMPLETE"){
            return true;
        } else {
            return false;
        }

    } catch (error) {
        
        genAlertPopup('Error generated during the training phase:' + error)

    };
   
};

  