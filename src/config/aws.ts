import AWS from "aws-sdk";

const s3 = new AWS.S3({
    endpoint: 'https://s3.filebase.com',
    signatureVersion: 'v4',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const FILEBASE_URL_PREFIX = 'https://beautiful-gold-bison.myfilebase.com/ipfs/';

export async function uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME || '',
        Key: fileName,
        Body: file,
        ContentType: contentType
    };

    try {
        return new Promise((resolve, reject) => {
            const request = s3.putObject(params);
            
            request.on('httpHeaders', (statusCode, headers) => {
                if (statusCode === 200) {
                    const cid = headers['x-amz-meta-cid'];
                    if (cid) {
                        resolve(`${FILEBASE_URL_PREFIX}${cid}`);
                    } else {
                        reject(new Error('CID not found in response headers'));
                    }
                }
            });

            request.on('error', (err) => {
                console.error('Error uploading file:', err);
                reject(err);
            });

            request.send();
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}