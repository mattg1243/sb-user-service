export enum CustomErrCodes {
  DNE = 'User does not exist in this table.',
}
/**
 * A custom error class for use with User and UserFollowing service functions.
 * @extends Error
 */
export class CustomErr extends Error {
  /**
   * Custom error codes for use in catch blocks.
   * @enum
   */
  code: CustomErrCodes;
  /**
   * Constructior calls Error class constructor with message param and sets custom error code.
   * @param message Passed to super constructor.
   * @param code Stored as a data member for catch block usage.
   */
  constructor(message: string, code: CustomErrCodes) {
    super(message);
    this.code = code;
  }
  /**
   * Logs the error message.
   * @param {LogFunction} logFn the function that does the logging.
   * @example
   * // calls console.log(this.message)
   * const err = new CustomErr('something went wrong');
   * err.log(console.log);
   */
  log(logFn: (message: string) => {}) {
    logFn(this.message);
  }
}
