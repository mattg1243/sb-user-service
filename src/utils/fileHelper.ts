// takes a file to be uploaded to the S3 bucket and returns the prefix
// of the location string
export const determineFileType = (file: Express.Multer.File): string => {
  // return variable
  let bucketLocationPrefix: string;
  const audioTypes = ['mp3', 'mp4', 'wav'];
  const imgTypes = ['jpeg', 'jpg', 'png'];
  // store filename
  const fileName = file.originalname;
  // take the extension from the file
  const finalPeriod = fileName.lastIndexOf('.') + 1;
  const fileExt = fileName.slice(finalPeriod);
  if (audioTypes.includes(fileExt)) {
    bucketLocationPrefix = 'beats/';
  } else if (imgTypes.includes(fileExt)) {
    bucketLocationPrefix = 'images/';
  } else {
    throw new Error('Invalid file type');
  }
  return bucketLocationPrefix;
};
