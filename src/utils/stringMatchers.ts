/**
 * Takes a URL in string form and returns a valid argument for new URL()
 */
export const makeValidUrl = (url: string): URL => {
  let validUrl = url;
  // check if already valid
  try {
    if (new URL(url)) {
      return new URL(url);
    }
  } catch (err) {
    console.log('invalid url');
  }
  // check for www
  if (url.slice(0, 4) !== 'www.') {
    validUrl = 'www.' + validUrl;
  }
  // check for https prefix
  if (url.split(':')[0] !== 'http' || url.split(':')[0] !== 'https') {
    validUrl = 'https://' + validUrl;
  }
  console.log(validUrl);
  return new URL(validUrl);
};
