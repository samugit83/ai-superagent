'use server'

import { S3Client, 
    CreateMultipartUploadCommand, 
    UploadPartCommand, 
    CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';



const createMultipartUpload = async ({Bucket, Key, s3Region}) => {

    const s3Client = new S3Client({region: s3Region});

    const params = {
    Bucket: Bucket,
    Key: Key
    };

    const response = await s3Client.send(new CreateMultipartUploadCommand(params));
    return response.UploadId;

}




const uploadPart = async ({Bucket, Key, PartNumber, UploadId, Body, s3Region}) => {

    const s3Client = new S3Client({region: s3Region});

    const buffer = Buffer.from(Body);

    const params = {
    Bucket: Bucket,
    Key: Key,
    PartNumber: PartNumber,
    UploadId: UploadId,
    Body: buffer
    };

    const response = await s3Client.send(new UploadPartCommand(params));

    return response;

};




const completeMultipartUpload = async ({Bucket, Key, MultipartUpload, UploadId, s3Region}) => {

    const s3Client = new S3Client({region: s3Region});

    const params = {
        Bucket: Bucket,
        Key: Key,
        MultipartUpload: MultipartUpload,
        UploadId: UploadId
    };

    try {
    let response = await s3Client.send(new CompleteMultipartUploadCommand(params));
    return response
    } catch (error) {
    console.error('Error completing multipart upload:', error);
    throw error;
    }

};




export const s3MultipartUpload = async ({
    Bucket, 
    Key, 
    MultipartUpload, 
    UploadId, 
    PartNumber, 
    Body, 
    s3Region,
    actionType}) => {


    let response_output
      
    if (actionType === 'create') {
      
      const newUploadId = await createMultipartUpload({Bucket, Key, MultipartUpload, UploadId, s3Region});
      response_output = {UploadId: newUploadId}
      
    } else if (actionType === 'uploadChunk') {
      
      const part = await uploadPart({Bucket, Key, PartNumber, UploadId, Body, s3Region});
      response_output = {part: part}
      
    } else if (actionType === 'complete') {
      
      const response = await completeMultipartUpload({Bucket, Key, MultipartUpload, UploadId, s3Region});
      response_output = response
      
    };

    return response_output

}

