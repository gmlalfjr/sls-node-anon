/**
 * error message.
 * @param {string} message - message success.
 * @param {string} statusCode - resposne status code.
 */
const errorResponse = (message, statusCode) => ({
  statusCode,
  body: JSON.stringify({
    ok: false,
    data: {},
    message,
  }),
});
export default errorResponse;
