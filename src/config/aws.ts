import AWS from "aws-sdk";

const s3 = new AWS.S3({
    endpoint: 'https://s3.filebase.com',
    signatureVersion: 'v4',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const FILEBASE_URL_PREFIX = 'https://beautiful-gold-bison.myfilebase.com/ipfs/';

export async function uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
    console.log('Starting upload with params:', {
        fileName,
        contentType,
        fileSize: file.length
    });

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME || '',
        Key: fileName,
        Body: file,
        ContentType: contentType
    };

    console.log('AWS bucket name:', process.env.AWS_BUCKET_NAME);

    try {
        return new Promise((resolve, reject) => {
            const request = s3.putObject(params);
            
            request.on('httpHeaders', (statusCode, headers) => {
                console.log('S3 response status:', statusCode);
                console.log('S3 response headers:', headers);
                
                if (statusCode === 200) {
                    const cid = headers['x-amz-meta-cid'];
                    if (cid) {
                        const url = `${FILEBASE_URL_PREFIX}${cid}`;
                        console.log('Generated URL:', url);
                        resolve(url);
                    } else {
                        reject(new Error('CID not found in response headers'));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${statusCode}`));
                }
            });

            request.on('error', (err) => {
                console.error('S3 upload error:', err);
                reject(err);
            });

            request.send();
        });
    } catch (error) {
        console.error('Upload function error:', error);
        throw error;
    }
}