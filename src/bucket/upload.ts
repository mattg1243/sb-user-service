import S3 from 'aws-sdk/clients/s3';
import fs from 'fs';
import { determineFileType } from '../utils/fileHelper';
import dotenv from 'dotenv';

dotenv.config();

const bucketName = process.env.S3_BUCKET_NAME;
const region = process.env.S3_BUCKET_REGION;
const accessKeyId = process.env.S3_ACCESS_KEY;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

const s3Client = new S3({
  region,
  accessKeyId,
  secretAccessKey,
});

export const uploadFileToS3 = async (file: Express.Multer.File) => {
  try {
    const prefix = determineFileType(file);
    const fileStream = fs.createReadStream(file.path);

    const uploadParams: S3.PutObjectRequest = {
      Bucket: bucketName ? bucketName : '',
      Body: fileStream,
      Key: prefix + file.filename,
    };
    const response = await s3Client.upload(uploadParams).promise();
    return Promise.resolve(response);
  } catch (err: any) {
    console.error(err.message);
  }
};
