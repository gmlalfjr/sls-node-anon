export default class ProcessError extends Error {
  constructor(message, statusCode, error) {
    super(message);

    this.message = message;
    this.statusCode = statusCode;
    this.error = error;
  }
}
