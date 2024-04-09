import {ingestionJob} from './ingestion_job'
import {s3MultipartUpload} from '@/server_actions/s3_multipart_upload'


function chunkFile(file, xFileSize, MaxChunkSize) {

    const nrChunks = Math.ceil(xFileSize / MaxChunkSize)
    const chunkSize = Math.round(xFileSize / nrChunks)

    const chunks = [];
    let offset = 0;

    for (let x = 0; x < nrChunks; x++) {
        const chunk = x < nrChunks - 1 ? file.slice(offset, offset + chunkSize) : file.slice(offset);
        chunks.push(Object.values(chunk));
        offset += chunkSize;
    }

  
    return chunks;
};



export const  multiPartUpload = async ({fileArray, handleUploadAndTrain, handleTrainingStatus, SelectedModel, genAlertPopup}) => {
    
  try {

    fileArray.forEach(xFile => {

        const xFileName = xFile.file.name
        const extensionMatch = xFileName.match(/\.([^.]+)$/);
        const xMimeExt = extensionMatch ? extensionMatch[0] : 'No extension';
        const xFileSize = xFile.file.size

        if(!SelectedModel.supportedFormat.includes(xMimeExt)) {
            genAlertPopup(`Formato file non supportato, possono essere trasferiti i seguenti tipi di file: ${SelectedModel.supportedFormat.join('; ')})`)
            return false; 
        }
        if(xFileSize > SelectedModel.maxFileSizeMB * 1024 * 1024) {
            genAlertPopup(`Le dimensioni del file superano il massimo consentito: ${SelectedModel.maxFileSizeMB}MB)`)
            return false;
        }
    });


    fileArray.forEach(async (xFile, idx) => {

        const xFileName = xFile.file.name
        const xFileSize = xFile.file.size
        
        const chunks = chunkFile(xFile.uint8Array, xFileSize, SelectedModel.MaxChunkSizeMB * 1024 * 1024);

        const totalChunks = chunks.length;
        let parts = [];
        const key = `${SelectedModel.s3folder}${xFileName}`;
        let params = {}

        params = {
            actionType: 'create', 
            Bucket: SelectedModel.s3Bucket,
            s3Region: SelectedModel.s3Region,
            Key: key,
        };

        const result = await s3MultipartUpload(params)

        const uploadId = result.UploadId

        handleUploadAndTrain([0, `Uploading ${idx + 1} di ${fileArray.length} files...`])

        for (let i = 0; i < totalChunks; i++) {

            handleUploadAndTrain([Math.round((i + 1) / totalChunks * 100), `Uploading ${idx + 1} di ${fileArray.length} files...`])

            params = {
                actionType: 'uploadChunk',
                Bucket: SelectedModel.s3Bucket,
                s3Region: SelectedModel.s3Region,
                Key: key,
                PartNumber: i + 1,
                UploadId: uploadId,
                Body: chunks[i]
              };

            const result = await s3MultipartUpload(params)

            const part = result.part
            parts.push({ PartNumber: i + 1, ETag: part.ETag });

        };  

        params = {
            actionType: 'complete',
            Bucket: SelectedModel.s3Bucket,
            s3Region: SelectedModel.s3Region,
            Key: key,
            MultipartUpload: { Parts: parts },
            UploadId: uploadId
        };

        const final_result = await s3MultipartUpload(params)

        if(final_result['$metadata']['httpStatusCode'] === 200) {

            handleUploadAndTrain([100, 'Upload completed!'])

            let result_job = await ingestionJob({
                handleUploadAndTrain, 
                knowledgeBaseId: SelectedModel.knowledgeBaseId, 
                dataSourceId: SelectedModel.dataSourceId,
                handleTrainingStatus,
                genAlertPopup})

            if(result_job) {
                handleUploadAndTrain([100, 'Training completed!'])
                genAlertPopup('Training completed!')
                handleTrainingStatus('sleep')
            } else {
                genAlertPopup('Error generated during the training phase')
            }

         }

    });

    } catch (error) {
            
        genAlertPopup('Error generated during the upload phase:' + error)

    };

    return true;

};

  