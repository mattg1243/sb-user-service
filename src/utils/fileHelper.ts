import mime from 'mime-types';

// takes a file to be uploaded to the S3 bucket and returns the prefix
// of the location string
export const determineFileType = (file: Express.Multer.File): string => {
  // return variable
  let bucketLocationPrefix: string;
  const audioTypes = ['mp3', 'mp4', 'wav'];
  const imgTypes = ['jpeg', 'jpg', 'png'];
  console.log(mime.contentType('audio/*'));
  console.log(mime.contentType('image/*'));
  // store filename
  const fileName = file.originalname;
  // take the extension from the file
  const finalPeriod = fileName.lastIndexOf('.') + 1;
  const fileExt = fileName.slice(finalPeriod);
  if (
    file.mimetype === mime.contentType('audio/mp3') ||
    file.mimetype === mime.contentType('audio/mp4') ||
    file.mimetype === mime.contentType('audio/wav')
  ) {
    bucketLocationPrefix = 'beats/';
  } else if (
    file.mimetype === mime.contentType('image/png') ||
    file.mimetype === mime.contentType('image/jpeg') ||
    file.mimetype === mime.contentType('image/jpg')
  ) {
    bucketLocationPrefix = 'images/';
  } else {
    throw new Error(`Invalid file type ${fileExt}`);
  }
  return bucketLocationPrefix;
};
